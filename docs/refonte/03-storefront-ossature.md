# Phase 2 — Storefront : ossature + complétion home + SEO embarqué

## Objectif de cette passe

Terminer l'ossature commune (header, footer, design-system, mini-cart,
pages 404/500) **et** retravailler en profondeur le contenu de la home
(hero éditorial, sections, CTAs, social proof, engagements, atelier, coffrets).
L'ancien site avait un hero pauvre et un copy à plat (cf. `audit-site-actuel.md`
§ 3 et § 8). On en profite pour redresser ça, pas pour porter l'existant.

Cette phase embarque aussi les fondations SEO côté storefront : helper
`generateMetadata`, schemas globaux (`Organization`, `WebSite`), composant
`<Breadcrumb>` + JSON-LD `BreadcrumbList` réutilisable.

---

## PROMPT À COPIER-COLLER

```
On démarre la **Phase 2 — Ossature storefront + contenu home + SEO embarqué**
de la refonte Lehena. Lis avant tout :

1. `docs/refonte/00-PLAN.md` (Phase 2 § 3, sous-sections 2a→2d)
2. `docs/refonte/audit-site-actuel.md` (§ 3, § 7, § 8) — ce qui manque dans la home actuelle
3. `docs/refonte/strategie-seo.md` (§ 3, § 4, § 5, § 11→Phase 2) — le SEO embarqué

Confirme-moi avoir lu avant de commencer.

## Étape 1 — Reconnaissance

- Quels composants Lehena existent déjà côté storefront ? Liste exhaustive
  (`apps/storefront/src/modules/**/lehena*`, `**/lehena-*`).
- Quel est l'état du fichier `styles/globals.css` : tokens CSS définis,
  scopes (`html.lehena`...) ?
- Quels composants atomiques (Button, Input, Modal, Drawer…) existent
  déjà — ceux du starter Medusa et ceux Lehena ?
- Y a-t-il un header / footer actifs ? Que contiennent-ils ?
- Comment est implémentée l'i18n actuelle (segment `[countryCode]`) ?

## Étape 2 — Choix techniques à valider avec moi

a. **Design system structure** :
   - Recommandes-tu de créer `apps/storefront/src/components/ds/` (tokens,
     atoms partagés) ou de continuer à scinder par module (`modules/common`) ?
   - Quels atoms minimum sont requis : Button (variants), IconButton, Link,
     Input, Textarea, Select, Checkbox, Radio, Switch, Badge, Tag, Tabs,
     Accordion, Modal, Drawer, Tooltip, Toast, Breadcrumb, Pagination,
     Skeleton, Avatar ? Confirme la liste.
   - Variants : `primary | secondary | ghost | link` pour Button. Tailles ?
   - Tu utilises Tailwind ou tu écris du CSS avec les variables `globals.css` ?
     Recommande la solution la plus cohérente avec ce qui existe.

b. **Header Lehena** :
   - Layout : logo gauche, nav centrale (catégories), actions droite (recherche,
     compte, panier, sélecteur langue) ?
   - Comportement scroll : sticky avec rétractation ?
   - Annonce bar au-dessus (livraison offerte dès X €) : configurable
     via une env variable ou côté CMS Pages ?
   - Drawer recherche : ouvert via icône, fermé par défaut, autocomplete
     branchée en Phase 3.
   - Sélecteur langue : prépare le terrain (FR uniquement en V1, ES/EN en Phase 4).

c. **Footer Lehena** :
   - 4 colonnes : Marque (logo + baseline + réseaux sociaux), Boutique
     (catégories), Maison (Notre histoire, La ferme, Engagements, Atelier),
     Aide (Contact, FAQ, CGV, Mentions, Politique conf).
   - Newsletter inline (formulaire) ou bloc dédié au-dessus du footer ?
   - Badges paiement + livraison + label Pays Basque en bas.
   - Pas de Lorem ipsum (référence à l'ancien site).

d. **Mini-cart drawer** :
   - Ouverture latérale droite, items avec image + quantité éditable + prix,
     sous-total, CTA "Voir le panier" + "Commander".
   - Animation d'ouverture / fermeture (Framer Motion ou CSS transitions).

e. **Complétion de la home** — pour chaque section ci-dessous, propose-moi
   un brief (titre, sous-titre, copy 50-100 mots, CTAs, données nécessaires) :
   1. **Hero éditorial** : 1 promesse forte ("Charcuterie d'exception au Pays
      Basque, sans nitrite, depuis 1974"), 2 CTAs ("Découvrir le Jambon Orhi"
      primaire, "Notre histoire" secondaire), visuel produit/atelier fort.
   2. **Bandeau réassurance** : 4-5 USP avec icônes (Sans nitrite / Race
      Duroc / Affinage 24 mois / Livraison Chronofresh / Frais offerts dès X €).
   3. **Notre signature** : produit phare (Jambon Orhi 24 mois), storytelling,
      CTA PDP.
   4. **Best-sellers** : grid 4-6 produits récupérés depuis Medusa (tag
      `bestseller` ou collection dédiée).
   5. **L'atelier en images** : carrousel 4-6 photos + CTA "/la-ferme".
   6. **Engagements chiffrés** : 4-6 piliers avec chiffre + titre + 1 ligne.
   7. **Social proof** : 2-3 avis clients (placeholder en Phase 2, vrais
      en Phase 10), logos presse, étoiles globales.
   8. **Coffrets & cadeaux** : bloc dédié avec CTA collection coffrets.
   9. **Carte / Où nous trouver** : visuel atelier Pays Basque + CTA
      "/atelier" (la page atelier sera créée en Phase 9).
   10. **Newsletter** : promesse claire (recettes + nouveautés saisonnières),
       champ email + double opt-in (l'API Brevo viendra en Phase 7, ici on
       câble un endpoint stub `/api/newsletter` qui logue).
   11. **Footer** : déjà briefé en (c).

   Pour les sections qui n'existent pas encore dans
   `modules/home/components/lehena/`, propose les fichiers à créer.

f. **Brief copywriting** — produis un livrable `docs/refonte/brief-copy.md` :
   - Ton de voix : 4-5 adjectifs (éditorial, ancré, sensoriel, premium, chaleureux)
     avec un exemple "à dire" / "à ne pas dire".
   - Vocabulaire Lehena : glossaire avec capitalisation + définition courte
     (Orhi, Iparralde, Laminak, Duroc, Salies-de-Béarn, patxaran, Pays Basque
     vs Iparralde, ventrêche, salaison, affinage, persillage…).
   - Règles d'écriture : majuscules, anglicismes interdits ou tolérés,
     longueur titres, longueur paragraphes.

g. **SEO embarqué** :
   - `lib/seo/metadata.ts` : helper `buildMetadata({ title?, description?,
     ogImage?, canonical?, noindex? })` avec defaults Lehena (template title,
     OG image fallback, base canonical url).
   - `lib/seo/schemas/` : un fichier par schéma JSON-LD avec helpers fortement
     typés (`organizationSchema()`, `websiteSchema()`, `breadcrumbSchema(items)`).
   - Composant `<JsonLd schema={...} />` à dropper dans n'importe quelle page.
   - Composant `<Breadcrumb items={...} />` : rendu visuel + JSON-LD couplés.
   - Injection dans `app/layout.tsx` des schemas `Organization` + `WebSite`.

## Étape 3 — Plan détaillé (à valider avant code)

Sur la base de mes réponses, propose 5-7 sous-passes (objectif, fichiers,
livrable). Mon attendu :

- A : Design system (tokens + atoms minimum).
- B : Header + annonce bar.
- C : Footer + newsletter stub.
- D : Mini-cart drawer.
- E : Sections home manquantes + branchement des données Medusa.
- F : SEO embarqué (metadata helper + schemas + Breadcrumb).
- G : Pages 404 / 500 / loading skeletons Lehena.
- H : Brief copywriting livré.

## Étape 4 — Implémentation

- Branche `feat/phase-2-storefront-ossature`.
- Server Components par défaut. Client Component uniquement si interactif
  (drawer, accordéon, autocomplete, sélecteur). Marquer explicitement
  `"use client"` en haut quand requis.
- Toutes les images : `next/image` avec dimensions + `priority` sur LCP.
- Accessibilité testée au clavier sur chaque atom avant validation.
- Storybook **PAS** demandé en V1 (overhead trop important pour le bénéfice).

## Contraintes (rappel)

- TypeScript strict, zéro `any`.
- ARIA pertinent, pas par défaut sur tous les divs.
- Contraste WCAG AA minimum sur la palette terroir (vérifier rouge/argile sur fond crème).
- Pas de dépendance JS > 30 ko gzip ajoutée sans justification.
- Schemas SEO injectés via `<script type="application/ld+json">`, pas via composant client.

## Ce que tu NE fais PAS dans cette phase

- Pas de PDP, pas de catégorie, pas de recherche (Phase 3).
- Pas de CMS Pages côté storefront (Phase 4).
- Pas de checkout (Phase 5).
- Pas de page atelier (Phase 9) : ici, le CTA pointe vers une page placeholder
  qui sera remplacée plus tard.
- Pas de vrai branchement Brevo : juste un endpoint stub.

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Header + footer + mini-cart rendus sur toutes les pages.
- [ ] Home contient les 10 sections briefées, avec copy validé et données Medusa branchées.
- [ ] `docs/refonte/brief-copy.md` livré.
- [ ] `lib/seo/metadata.ts` + helpers schemas utilisés sur la home + le layout.
- [ ] Breadcrumb rendu visuellement + JSON-LD valide (testable sur `validator.schema.org`).
- [ ] 404 et 500 Lehena rendues, utiles (recommandations + recherche).
- [ ] Loading skeletons cohérents avec le design.
- [ ] Lighthouse home en local : Performance ≥ 90, SEO 100, A11y ≥ 95.
- [ ] Aucun Lorem ipsum nulle part dans le footer / newsletter.
- [ ] Test clavier complet header + footer + mini-cart sans souris.

## Pièges courants

- **Tailwind + variables CSS** : choisir l'un OU l'autre comme source de
  vérité. Si on mixe, le design dérive vite. Le `globals.css` actuel pose
  les tokens — on les expose via `:root` et on évite Tailwind colors par
  défaut.
- **next/image dimensions implicites** : produit du CLS. Toujours `width` +
  `height` ou `fill` + `sizes`.
- **Schema.org `Organization`** : doit contenir `logo`, `url`, `sameAs` (réseaux
  sociaux), `contactPoint`. À renseigner réellement.
- **Hero LCP** : l'image hero doit être préchargée (`priority`) sinon LCP
  > 3 s.
- **Sticky header** : attention au CLS au scroll si la hauteur change.

## Commit final

Branche : `feat/phase-2-storefront-ossature`.
Commit final : `feat(storefront): ossature, home content rework, SEO foundations`.
PR vers `develop`.
