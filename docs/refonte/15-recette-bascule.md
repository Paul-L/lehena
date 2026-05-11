# Phase 14 — Recette & bascule production

## Objectif de cette passe

Valider la refonte sur staging (recette fonctionnelle exhaustive + UX
responsive + bêta privée), puis basculer la prod en minimisant le risque
(plan de bascule documenté, plan de rollback, monitoring renforcé J0 → J+7).

C'est la phase qui transforme "le site est prêt" en "le site tourne". Si une
seule étape est skippée, on prend des risques inutiles. Cette phase ne contient
**pas** d'écriture de code applicatif — uniquement de la coordination, des
checklists, et de la surveillance.

---

## PROMPT À COPIER-COLLER

```
On démarre la **Phase 14 — Recette & bascule** de la refonte Lehena. Lis :

1. `docs/refonte/00-PLAN.md` (Phase 14 § 3, et § 4 chemin critique)
2. `docs/refonte/strategie-seo.md` (§ 11→Phase 14)
3. `docs/refonte/deploy.md` (rédigé en Phase 13)

Confirme avoir lu.

## Étape 1 — Checklist recette fonctionnelle complète

Produis une checklist exhaustive et détaillée par module. Mon attendu, à
amender :

a. **Catalogue** :
   - [ ] Navigation par catégorie OK sur les 7 catégories.
   - [ ] Filtres facettes fonctionnels sur chaque catégorie.
   - [ ] PDP charge < 2s sur 3G.
   - [ ] Galerie multi-images, zoom OK clavier + tactile.
   - [ ] Sélecteur variantes met à jour prix + stock sans refresh.
   - [ ] Cross-sell affiché et pertinent.

b. **Recherche** :
   - [ ] Recherche typo-tolérante ("jamon" → "jambon").
   - [ ] Autocomplete répond < 100ms.
   - [ ] Page recherche fonctionne sans JS (SSR).

c. **Cart & Checkout** :
   - [ ] Ajout au panier depuis : PDP, card catégorie, mini-cart drawer.
   - [ ] Quantité modifiable sans rechargement.
   - [ ] Code promo valide / invalide → comportement attendu.
   - [ ] Carte cadeau utilisable.
   - [ ] Message cadeau et emballage cadeau remontent.
   - [ ] Stripe CB OK, 3DS OK, refusée OK.
   - [ ] Apple Pay + Google Pay testés sur appareil réel.
   - [ ] Alma 3x testé.
   - [ ] Frais offerts > seuil OK.
   - [ ] Panier mixte (fresh + ambient) comportement validé.

d. **Comptes** :
   - [ ] Inscription + welcome email.
   - [ ] Login password + magic link.
   - [ ] Reset password.
   - [ ] Espace client toutes pages accessibles.
   - [ ] Re-order fonctionne.
   - [ ] Wishlist persiste.
   - [ ] Facture PDF téléchargeable.
   - [ ] Export RGPD JSON cohérent.
   - [ ] Suppression compte anonymise + cancel abonnements actifs.

e. **CMS** :
   - [ ] Toutes les pages éditoriales légales en ligne (CGV, mentions,
         conf, FAQ, contact).
   - [ ] Pages piliers publiées.
   - [ ] Articles supports en ligne.
   - [ ] Embed produit dans articles OK.

f. **Multilingue** :
   - [ ] FR / ES / EN basculent correctement.
   - [ ] hreflang valides.
   - [ ] Sitemap multilingue.

g. **Emails** :
   - [ ] Tous les emails transactionnels testés (commande, expédition,
         livraison, abandon panier, reset, magic link, facture, RGPD).
   - [ ] Rendu OK Gmail, Outlook web, Apple Mail.

h. **Admin** :
   - [ ] Widgets dashboard fonctionnels.
   - [ ] Recettes : créer / publier / lier à un produit.
   - [ ] Avis : modérer / approuver / rejeter.
   - [ ] Export CSV commandes lisible Excel FR.
   - [ ] Alertes stock + DDM reçues.

i. **SEO** :
   - [ ] Tous les schemas valides (validator.schema.org).
   - [ ] Sitemap soumis Search Console + Bing.
   - [ ] Redirects 301 testés sur 50 URLs aléatoires de l'ancien site.
   - [ ] Lighthouse CI passe les seuils.

j. **Observabilité** :
   - [ ] Plausible reçoit les events.
   - [ ] Sentry reçoit les erreurs.
   - [ ] UptimeRobot/Better Stack monitor actif.

## Étape 2 — Recette responsive

Tester manuellement sur :
- iPhone SE (small, 375px)
- iPhone 15 / 15 Pro
- iPad portrait
- Tablette Android
- Desktop 1280px
- Desktop 1920px+

Parcours minimum à tester sur chacun : home → catégorie → PDP →
add to cart → checkout step 1.

Captures d'écran sauvegardées dans `docs/refonte/recette-screenshots/`.

## Étape 3 — Bêta privée (1 semaine)

- Sélectionner 8-12 clients fidèles ou personnes proches Lehena.
- Leur envoyer un lien staging avec compte test ou compte réel migré.
- Brief court : "Faites une vraie commande (remboursée). Notez tout ce qui
  vous chiffonne. Nous voulons votre ressenti UX + bugs."
- Récolter dans un Google Doc / Notion (1 doc partagé).
- Synthèse + tickets prioritaires (P0 bloquant / P1 majeur / P2 mineur).
- Correction des P0 + P1 avant bascule.
- Les P2 partent dans le backlog V1.1.

## Étape 4 — Préparation bascule

a. **Freeze code** :
   - 48 h avant J0, freeze `develop`.
   - Plus que les fixes de blockers, validés par Paul.

b. **Dry-run migration finale** :
   - Reproduire la migration sur un dump prod **frais** de l'ancien site.
   - Vérifier nombre de produits, clients, médias.
   - Tester 20 URLs aléatoires en 301.

c. **Plan de bascule** dans `docs/refonte/plan-bascule.md` :
   - T-7j : annoncer aux clients (newsletter "Nous modernisons Lehena, le
     site sera indispo entre X et Y").
   - T-24h : freeze final ancien site (mettre en mode lecture seule si
     possible).
   - T-2h : dernière migration (delta).
   - T-1h : sanity check production.
   - T0 : bascule DNS (CNAME / A record vers Vercel + Railway).
   - T+15min : check propagation DNS + check `/health`.
   - T+1h : tour de plateformes (Plausible, Sentry, UptimeRobot, Search Console).
   - T+24h : revue trafic, erreurs, conversions.

d. **Plan de rollback** :
   - Si bascule échoue : remettre DNS sur l'ancien site (TTL court 5 min
     configuré J-7).
   - Communiquer aux clients en moins de 2h.

## Étape 5 — Monitoring J0 → J+7

- J0 : monitoring continu (Sentry, Plausible, UptimeRobot, Search Console).
- J+1 : revue trafic vs J-1 (estim. -20 % à -40 % normal en transition SEO),
  erreurs Sentry à traiter en priorité.
- J+3 : revue redirects (Search Console "Couverture" → erreurs 4xx).
- J+7 : revue Search Console détaillée, positions critiques (best-sellers +
  page pilier principale), trafic, conversions.
- J+30 : revue complète + backlog V1.1.

Tous les checks documentés dans `docs/refonte/monitoring-bascule.md`.

## Étape 6 — Post-mortem

Une semaine après bascule, document `docs/refonte/post-mortem.md` :
- Ce qui s'est bien passé.
- Ce qui s'est mal passé.
- Décisions à inverser ou conserver.
- Backlog V1.1 priorisé.

Vas-y, commence par l'étape 1 : produis-moi la checklist recette détaillée.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Checklist recette complète, cochée à 100 %.
- [ ] Recette responsive validée sur les 6 devices/tailles.
- [ ] Bêta privée : 8-12 testeurs, retours collectés, P0 et P1 corrigés.
- [ ] `plan-bascule.md` rédigé et validé.
- [ ] `plan-rollback.md` rédigé.
- [ ] Bascule DNS réussie, propagation < 15 min.
- [ ] J+1 / J+3 / J+7 monitorings effectués et documentés.
- [ ] Post-mortem rédigé.
- [ ] Backlog V1.1 priorisé.

## Pièges courants

- **DNS TTL** : configurer le TTL à 5 min **7 jours avant** la bascule, sinon
  les caches DNS publics peuvent garder l'ancien site plusieurs heures.
- **Bêta privée sur staging vs prod** : si on teste sur staging, Stripe en
  mode test → les vrais paiements ne sont pas testés. Idéal : créer un mode
  "early access" en prod avec un code promo masqué.
- **Recette responsive sur device réel** : ne PAS se contenter du devtools
  Chrome. Tester sur vrai iPhone SE et tablet Android.
- **Search Console** : la nouvelle propriété doit être ajoutée et vérifiée
  **avant** la bascule, sinon perte de visibilité plusieurs jours.
- **Newsletter d'annonce de bascule** : envoyer 7 jours avant, et **rappeler**
  J-2. Sans ça, les clients tombent sur la maintenance sans contexte.
- **Sentry sampling** : si on a fixé 10 % de traces en Phase 12 pour économiser,
  le passer à 100 % pendant la première semaine post-bascule pour ne rien
  rater.

## Commit final

Branche : `chore/phase-14-bascule`.
Commit : `chore(bascule): recette, bêta, dns, monitoring J0→J+7, post-mortem`.

## Après cette phase

🎉 La refonte est en ligne.

Backlog V1.1 typique :
- Connexion sociale (Google login).
- Programme de fidélité.
- Connexion Phase 11 si reportée.
- Plugin Pilot AI (cf. `docs/pilot-ai/`).
- Optimisations SEO continue (suivi positions + ajout articles).
