# Phase 9 — SEO : audit final, pages piliers, local SEO

## Objectif de cette passe

Capitaliser sur tout le SEO embarqué dans les phases précédentes : audit
technique exhaustif, production des **6 pages piliers** d'autorité +
calendrier éditorial pour les articles supports, finalisation du **local
SEO** (page atelier + GBP + LocalBusiness schema), tracking SEO.

C'est la phase qui transforme le SEO "techniquement propre" en SEO "moteur
de trafic". Le copywriter doit avoir produit (ou démarré) les pages piliers
en parallèle des Phases 4-8.

---

## PROMPT À COPIER-COLLER

```
On démarre la **Phase 9 — SEO** de la refonte Lehena. C'est la phase finale
de capitalisation SEO. Lis intégralement :

1. `docs/refonte/00-PLAN.md` (Phase 9 § 3)
2. `docs/refonte/audit-site-actuel.md` (§ 6, § 8, § 9)
3. `docs/refonte/strategie-seo.md` (intégralité, c'est la doctrine de cette phase)

Confirme avoir lu.

## Étape 1 — Reconnaissance

- Quels schemas JSON-LD sont effectivement présents en production sur quelles
  pages ? Liste-les en parcourant le code des templates.
- État du sitemap (`next-sitemap.js` + `next-sitemap` lib) : couvre-t-il
  produits, catégories, pages éditoriales, articles, traductions ?
- État du fichier `robots.txt` : qu'autorise-t-il ?
- Y a-t-il une page `/atelier` créée (Phase 4) ? Si oui dans quel état ?
- Y a-t-il un module `articles` côté backend (pour les articles supports) ?
  J'attends "non" : à créer dans cette phase, ou via le module Pages avec un
  flag `type: "article"` ?

## Étape 2 — Choix techniques à valider

a. **Module Articles vs réutilisation du module Pages** :
   - Option 1 : ajouter un champ `type: "page" | "article" | "recipe"` à
     l'entité Page, plus des champs `author_id`, `published_at`,
     `pillar_id` (pour rattacher au pilier), `tags[]`.
   - Option 2 : créer un module Article séparé (entité + service + admin).
   - Recommande l'option qui colle le mieux à la philosophie Medusa (DRY) et
     à la simplicité de maintenance.

b. **Auteurs** :
   - Entité `author` simple : name, slug, bio, photo, social links.
   - Schema `Person` injecté sur les pages articles.

c. **Page atelier** (`/fr/atelier`) :
   - Contenu : adresse, horaires, photos atelier (4-6), plan d'accès Google
     Maps embed (avec consentement RGPD), parking, contact, "venir nous
     visiter sur RDV".
   - Schema `LocalBusiness` subtype `FoodStore` avec `address`, `geo`,
     `openingHoursSpecification`, `telephone`, `email`, `priceRange`, `image`,
     `url`.
   - NAP (Name, Address, Phone) cohérent avec footer + GBP + schema.

d. **Sitemap segmenté** :
   - `sitemap-products.xml`
   - `sitemap-categories.xml`
   - `sitemap-pages.xml` (pages éditoriales)
   - `sitemap-articles.xml`
   - `sitemap-recipes.xml`
   - `sitemap.xml` (index qui pointe vers les 5).
   - Génération build-time + rebuild on revalidation.

e. **Audit Screaming Frog (ou équivalent)** :
   - Liste de checks à exécuter : 4xx, 5xx, chaînes redirects, titles dupliqués,
     descriptions dupliquées, h1 manquants, alt manquants, schema invalide.
   - Cible : 0 erreur 4xx/5xx interne.

f. **Lighthouse CI** :
   - Config sur 5 templates clés : home, catégorie, PDP, article, page atelier.
   - Seuils bloquants : Performance ≥ 90, SEO 100, A11y ≥ 95.

g. **Tracking SEO** :
   - Configurer Google Search Console : nouvelle propriété "domaine"
     (preferred) ou URL. Soumettre les sitemaps.
   - Bing Webmaster Tools : idem.
   - Plausible : déjà en Phase 12 mais ici on vérifie les goals SEO (purchase
     attribué à organique).

h. **Local SEO — GBP** :
   - Audit du Google Business Profile actuel (Paul a les accès ?).
   - Optimisation : catégorie principale "Boucherie-charcuterie", catégories
     secondaires, photos récentes (atelier, équipe, produits), posts hebdo
     préparés, attributs (parking, livraison locale, paiement CB).
   - Demande systématique d'avis post-achat (workflow email J+10 piloté
     depuis le subscriber `order-delivered`).

i. **Production de contenu** — cf. `strategie-seo.md` § 2 :
   - **6 pages piliers** publiées (texte produit par copywriter, intégration
     CMS par Claude Code via prompt dédié si besoin).
   - Au moins **5 articles supports** publiés ou planifiés sur le pilier
     "Jambon sans nitrite" (le plus stratégique).
   - **Calendrier éditorial 12 mois** dans `docs/refonte/calendrier-editorial.md`
     avec pour chaque article : titre, pilier rattaché, mot-clé principal,
     mots-clés secondaires, volume estimé, intent, date prévue, statut.

## Étape 3 — Plan détaillé

7-9 sous-passes :

- A : Module Articles + Auteurs (ou extension Pages).
- B : Page atelier complète + schema LocalBusiness.
- C : Sitemap segmenté.
- D : Audit Screaming Frog + corrections.
- E : Lighthouse CI configuré + seuils en CI.
- F : Search Console + Bing soumis et vérifiés.
- G : Production / intégration des 6 piliers (CMS).
- H : 5 articles supports pilier "Jambon sans nitrite".
- I : Calendrier éditorial 12 mois + audit GBP + workflow demande d'avis.

## Étape 4 — Implémentation

- Branche `feat/phase-9-seo-content-local`.
- Pour chaque pilier intégré : valider visuellement + tester schema valide
  + vérifier indexabilité via "Inspect URL" Search Console.
- Workflow demande d'avis : email J+10 après livraison avec lien d'avis
  Trustpilot (ou simple formulaire interne en V1, cf. Phase 10).

## Contraintes (rappel)

- Aucune page pilier publiée sans validation copy par Paul.
- Aucun schema injecté sans validation `validator.schema.org` au préalable.
- Pas de "fake" avis ni "fake" presse (mention "logos presse" placeholder
  uniquement si vrais accords).

## Ce que tu NE fais PAS

- Pas d'achat de backlinks.
- Pas de spam de commentaires sur des blogs.
- Pas de techniques SEO black hat (cloaking, doorway pages, etc.).

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Les 6 pages piliers sont publiées (ou planifiées avec date claire).
- [ ] 5 articles supports publiés sur pilier "Jambon sans nitrite".
- [ ] `calendrier-editorial.md` 12 mois rédigé.
- [ ] Page `/fr/atelier` complète et indexée, schema LocalBusiness valide.
- [ ] Sitemap segmenté, soumis à Search Console FR + ES + EN, indexation
      commencée.
- [ ] Bing Webmaster Tools configuré.
- [ ] Lighthouse CI passe les seuils sur les 5 templates.
- [ ] 0 erreur 4xx/5xx interne sur Screaming Frog.
- [ ] GBP optimisé, 1er post hebdo publié.
- [ ] Workflow demande d'avis J+10 actif.

## Pièges courants

- **GBP** : compte Google personnel vs marque. Vérifier qui est admin.
- **LocalBusiness schema** : `openingHoursSpecification` doit utiliser le
  format ISO 8601 sur les jours (`Mo, Tu, We…`). Erreur fréquente.
- **Sitemap soumission** : 1 sitemap par langue dans Search Console, pas un
  seul global mixte.
- **Pillar pages** : ne pas publier 6 piliers en même temps. Échelonner sur
  3-4 semaines pour donner le temps à Google d'indexer.
- **`hreflang`** : si une page existe en FR mais pas en ES, ne PAS pointer
  vers une 404 traduite — laisser FR par défaut avec `noindex` sur la version
  par défaut servie aux Espagnols (ou inversement).

## Commit final

Branche : `feat/phase-9-seo-content-local`.
Commit : `feat(seo): audit, pillars, articles, atelier page, local SEO, tracking`.
