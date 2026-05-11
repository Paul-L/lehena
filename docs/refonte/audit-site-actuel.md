# Audit de l'ancien Lehena.fr

> Audit réalisé par lecture des pages publiques (home, catégorie jambons,
> PDP "Jambon Orhi désossé 24 mois") en mai 2026.
>
> Sert de **référentiel objectif** : ce qu'on garde, ce qu'on coupe, ce qu'on
> améliore. À relire avant chaque phase de la refonte.

---

## 1. Stack et structure

| Élément | Constat |
|---|---|
| Plateforme | WordPress + WooCommerce + thème custom "Inovesign" |
| Tracking | Site Kit Google + Pixel Facebook (visible dans le head) |
| URLs produit | `/produit/<slug>/` — slugs courts, lisibles ✅ |
| URLs catégorie | `/categorie-produit/<slug>/` — verbose mais OK |
| Hébergement | Non identifié — probablement mutualisé, perfs à benchmarker |
| Bandeau cookies | Présent mais "OK" en seul bouton (non conforme RGPD) ❌ |

---

## 2. Catalogue observé

Catalogue restreint (~10-20 produits visibles via les catégories).

Catégories actives :
- **Jambon d'Iparralde sans nitrite** : Jambon Orhi entier (avec/sans os, demi, quart), Jambon par 4 tranches, Os de jambon, Quart de jambon, accessoires (planche + couteau, support).
- **Salaisons** : ventrêche entière, demi-ventrêche, etc.
- **Patxaran des Laminak Maison**.
- **Épicerie / plats cuisinés**.

Observations :
- **Mélange produits + accessoires** dans la même grille catégorie (planche, support, couteau apparaissent dans "Jambons") — UX dégradée, à séparer en catégorie "Accessoires" ou en cross-sell.
- **Pas de variantes propres** : on a "Jambon entier désossé", "Demi jambon", "Quart de jambon" comme **3 produits séparés** au lieu d'un produit avec 3 formats. À refondre en un produit + variantes côté Medusa.
- **Stock visible** sur PDP ("29 in stock") en libellé anglais 🤨.
- **Étiquetage nutritionnel / allergènes / DDM** non visible.

---

## 3. Home page actuelle

### Ce qui existe
- Hero : "Sublimateur de saveurs — Maître Artisan Charcutier" + 1 CTA "Découvrir nos produits".
- Bandeau 3 USP : Livraison Chronofresh / Frais de port offerts dès 50 € / Qualité garantie.
- Bloc "Lehena, Toute une Histoire" + CTA "En savoir plus".
- Bloc "Jambon" (race Duroc, sans nitrite, 15 mois) + CTA catégorie.
- Bloc "La Boutique Lehena" : 3 produits aléatoires + CTA boutique.
- Newsletter en footer.

### Ce qui manque (à intégrer dans la nouvelle home)
- **Hiérarchie d'intention** dans le hero : 1 promesse forte + 2 CTA (primaire + secondaire).
- **Produit phare scénarisé** (Jambon Orhi 24 mois) avec storytelling.
- **Best-sellers** explicitement mis en avant.
- **Engagements chiffrés** (sans nitrite / race Duroc / sel de Salies / 24 mois d'affinage / Pays Basque) — déjà esquissé par la home Lehena nouvelle dans `modules/home/components/lehena/`.
- **Social proof** : avis clients, étoiles, citation, presse, récompenses.
- **Storytelling visuel** de l'atelier / la ferme.
- **Cross-sell coffrets / cadeaux** (énorme manque commercial).
- **Carte / "où nous trouver"** : Lehena est physique au Pays Basque, c'est un asset à exploiter.
- **Newsletter brandée** (l'actuelle a du `Lorem ipsum` visible 🚨).

---

## 4. Page catégorie actuelle

### Constat
- Tri simple (nom, prix, date, popularité, note) — pas de filtres facettes.
- Pas de breadcrumb visible dans le HTML.
- Pas de description SEO en haut de catégorie au-delà du titre H1.
- Pagination simple, pas de "load more".
- Cartes produit minimales : image + titre + prix. Pas de badges (sans nitrite, affiné X mois, best-seller…).

### À prévoir refonte
- **Filtres facettes** : type, terroir, durée d'affinage, prix, sans nitrite (oui), allergènes, format (entier/demi/tranches).
- **Breadcrumb** visuel + JSON-LD.
- **Texte SEO** au-dessus / en-dessous de la grille (~150-300 mots optimisés sur la requête cible).
- **Cartes produit Lehena** avec badges (Lehena-product-card existe déjà).
- **Quick view** PDP-light depuis la grille.

---

## 5. PDP actuelle (Jambon Orhi désossé 24 mois)

### Constat
- Titre + prix + 1 image + bloc texte description + CTA "Add to cart" en anglais 🤨.
- Description = 1 paragraphe + liste à puces.
- Onglets : Description / Additional information (= "Weight: 7.5 kg", c'est tout) / Reviews (0 avis).
- Related products : 4 produits (mais accessoires mélangés).
- **Boutons share Facebook / Twitter / Pinterest / Email**.
- Pas de zoom image, pas de galerie multi-images, pas de vidéo.
- Stock affiché : "29 in stock".
- **Meta description tronquée commence par "Offre promotionnelle jusqu'au 1 mai 2025"** — date périmée encore en ligne ⚠️.

### À prévoir refonte (cf. `lehena-pdp/` déjà amorcé)
- **Galerie multi-images** + zoom + idéalement vidéo (atelier / découpe).
- **Sélecteur de variantes** : entier / demi / quart / tranches (pas 4 produits séparés).
- **Bloc "Le geste"** : storytelling production (déjà prévu).
- **Bloc accords / pairings** : à servir avec Patxaran X, fromage Y, vin Z.
- **Bloc "À conserver / à déguster"** : T° conservation, à sortir 30 min avant, etc.
- **Bloc valeurs nutritionnelles + ingrédients + allergènes** structuré.
- **Bloc FAQ produit** : "Combien de personnes pour un jambon entier ?", "Comment le découper ?", "Combien de temps après réception ?".
- **Avis client** : à activer (récolte automatique via email J+15).
- **Réassurance livraison** : indication date de livraison estimée selon code postal.
- **Trust badges** : sans nitrite, race Duroc, Pays Basque, sel Salies, X mois d'affinage.
- **Schema.org Product + AggregateRating + Offer** complet.

---

## 6. SEO actuel — état des lieux

### Métadonnées
- Meta description : ✅ présente sur home et catégorie, ⚠️ tronquée et **commence par une date périmée** sur la PDP auditée.
- Title : OK home et catégorie, suffixe redondant " — Maison Lehena" sur PDP.
- Open Graph + Twitter cards : ✅ présentes.
- Canonical : ✅ présent.
- robots : `index, follow, max-image-preview:large` ✅.

### Structure
- Pas de breadcrumb HTML/JSON-LD visible.
- H1 unique par page : OK.
- Schema.org Product : ❌ non visible dans le HTML servi.
- Schema.org Organization / LocalBusiness : ❌.
- Schema.org Article (pour Actualités) : à vérifier mais probablement absent.
- Schema.org FAQPage : ❌ aucune FAQ.

### Multilingue
- ❌ Site monolingue FR alors que :
  - Le nom est basque ("Lehena" = "premier" en basque).
  - Le marché Pays Basque a une forte composante ES naturelle.
  - Le tourisme international (EN) est un canal réel pour de l'épicerie haut de gamme.
- Pas de hreflang.

### Local SEO
- ❌ Pas de page atelier/boutique avec carte + horaires.
- ❌ Pas de schema LocalBusiness.
- ⚠️ Statut Google Business Profile à vérifier (probablement existe mais peu travaillé).
- Mention "Pays Basque" et "Sud-Ouest" : présente dans les descriptions mais pas optimisée pour des requêtes locales (ex: "charcuterie Pays Basque", "jambon sans nitrite Bayonne").

### Contenu / autorité
- "Actualités" : section présente, **contenu de fond non audité** mais structure laisse penser à un blog peu nourri.
- Aucune **page pilier SEO** identifiée :
  - "Tout savoir sur le jambon sans nitrite"
  - "Race Duroc : pourquoi nos cochons ?"
  - "L'affinage 24 mois expliqué"
  - "Patxaran : tradition basque"
  - "Sel de Salies de Béarn : pourquoi ?"
  - "Comment déguster un jambon entier"
- Pas de glossaire / lexique.
- Pas de recettes.

### Performance
- Bandeau cookies non bloquant côté script, mais Site Kit + Pixel Facebook dans le head = ralentit le LCP.
- Images servies sans format moderne visible.
- WordPress + thème custom = JS / CSS souvent peu purgés.
- À benchmarker : Lighthouse / PageSpeed Insights de l'ancien site avant la bascule pour mesurer le gain.

### Backlinks et notoriété
- Référencement de marque : OK (le nom est ancré).
- Référencement transactionnel ("jambon sans nitrite", "patxaran", "charcuterie Pays Basque en ligne") : à challenger via Ahrefs / Semrush / Ubersuggest.
- Sources d'autorité (presse, blogs cuisine) : potentiel sous-exploité, le storytelling Lehena (artisan, race Duroc, sans nitrite) est très "pressable".

---

## 7. UX / accessibilité

- Cookie banner non conforme.
- Plusieurs `Toggle Navigation` dupliqués dans le HTML (probable bug du thème).
- Newsletter avec **Lorem ipsum** visible côté front.
- Mélange FR / EN dans les libellés visibles ("Add to cart", "in stock", "Sort by").
- Pas de fil d'Ariane.
- Pas d'indicateur de page courante en navigation.
- Mobile : non testé en détail mais layout WordPress standard.

---

## 8. Synthèse — opportunités de la refonte

| Axe | Impact attendu | Phase de la refonte |
|---|---|---|
| Hero éditorial + CTA hiérarchisés + storytelling produit phare | Conversion +++ | Phase 2 (Storefront ossature) |
| Variantes produit propres (1 produit, N formats) | Conversion + UX +++ | Phase 1 (Modèle métier) |
| PDP enrichies (le geste, accords, FAQ, avis, trust) | Conversion + SEO +++ | Phase 3 |
| Filtres facettes + texte SEO catégorie | Conversion + SEO ++ | Phase 3 |
| Multilingue FR/ES/EN avec hreflang | Trafic international ++ | Phase 4 (CMS) + transverse |
| Schema.org Product / FAQ / Article / LocalBusiness | SEO +++ | Phase 9 (SEO) |
| Pages piliers SEO + glossaire + recettes | Trafic SEO long terme +++ | Phase 4 + content marketing transverse |
| Local SEO + page atelier + GBP optimisé | Trafic local + e-commerce ++ | Phase 9 |
| Performance Web Vitals (Next.js + ISR) | SEO + conversion ++ | Acquis par la stack, à mesurer |
| RGPD propre (consentement granulaire) | Conformité + confiance | Phase 7 (emails) + Phase 12 (tracking) |
| Newsletter sérieuse (pas de Lorem ipsum) | Image + acquisition ++ | Phase 7 |
| Avis clients (collecte + affichage + schéma) | Conversion + SEO +++ | Phase 10 (admin custom) |

---

## 9. À ne pas perdre lors de la migration

- **URLs existantes indexées** : table de redirections 301 obligatoire (cf. Phase 8 du plan).
  - `/produit/<slug>/` → `/[lang]/produits/<slug>/`
  - `/categorie-produit/<slug>/` → `/[lang]/categories/<slug>/`
  - `/notre-histoire/`, `/de-la-ferme-a-lassiette/`, `/contactez-nous/`, `/actualites/`, `/cgv/`, `/mentions-legales/`, `/privacy-policy/` → équivalents nouveau site.
- **Backlinks** acquis : à inventorier via Ahrefs/Semrush avant bascule.
- **Notoriété GBP** + avis Google.
- **Comptes clients** existants (cf. Phase 8).
- **Historique de commandes** : à arbitrer (gardé hors scope dans la décision actuelle).
