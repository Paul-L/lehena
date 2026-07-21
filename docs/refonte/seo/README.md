# SEO ecommerce Lehena — Série de prompts Claude Code

Prompts autoportants pour implémenter les optimisations SEO 2026 sur le
storefront + backend Lehena. Chaque prompt est indépendant, à copier-coller
dans Claude Code depuis le workspace `/Users/paul/Apps/Lehena`.

> Cette série **complète** la doctrine `docs/refonte/strategie-seo.md` avec
> les leviers modernes qu'on n'y avait pas encore explicités :
> Google Merchant feed, GEO (Generative Engine Optimization pour les LLMs),
> signaux EEAT, schema.org avancé, Web Vitals monitoring RUM.

## Prérequis

Avant tout prompt :

1. Storefront + backend en ligne (cf. `deploy-recap.md`)
2. `docs/refonte/strategie-seo.md` lu (doctrine)
3. `apps/backend/src/lib/company.ts` renseigné avec les infos société réelles
4. Google Search Console + Bing Webmaster Tools connectés
5. Compte Google Merchant Center créé et domaine vérifié (pour le prompt 01)

## Ordre d'exécution recommandé

| #   | Prompt                                                            | Impact SEO | Effort | Dépendances             |
| --- | ----------------------------------------------------------------- | ---------- | ------ | ----------------------- |
| 01  | [feed-google-merchant.md](./01-feed-google-merchant.md)           | ★★★★★      | 4-6h   | Merchant Center account |
| 02  | [schema-product-pdp.md](./02-schema-product-pdp.md)               | ★★★★☆      | 3h     | Reviews module (11)     |
| 03  | [schema-global-org-website.md](./03-schema-global-org-website.md) | ★★★☆☆      | 1h     | —                       |
| 04  | [sitemap-robots.md](./04-sitemap-robots.md)                       | ★★★★☆      | 2h     | —                       |
| 05  | [schema-local-business.md](./05-schema-local-business.md)         | ★★★★☆      | 2h     | Page /atelier existante |
| 06  | [faq-pillars.md](./06-faq-pillars.md)                             | ★★★★☆      | 4h     | Piliers rédigés         |
| 07  | [article-author-eeat.md](./07-article-author-eeat.md)             | ★★★★☆      | 3h     | Module author           |
| 08  | [llms-txt-geo.md](./08-llms-txt-geo.md)                           | ★★★☆☆      | 1h     | —                       |
| 09  | [meta-og-generator.md](./09-meta-og-generator.md)                 | ★★★★☆      | 3h     | —                       |
| 10  | [images-webvitals.md](./10-images-webvitals.md)                   | ★★★★☆      | 3h     | Plausible actif         |
| 11  | [reviews-aggregate.md](./11-reviews-aggregate.md)                 | ★★★★☆      | 4h     | Reviews module actif    |
| 12  | [audit-final.md](./12-audit-final.md)                             | ★★★☆☆      | 2h     | Tout ci-dessus fait     |

**Effort total** : ~30-35 h de dev réparties. Ordre indicatif — les
prompts 01, 03, 04, 08, 09 sont indépendants et peuvent être lancés en
parallèle.

## Conventions globales

- **TypeScript strict**, zéro `any`, zéro `@ts-ignore`
- Schemas JSON-LD injectés via le composant `<JsonLd>` déjà en place
  (`apps/storefront/src/lib/seo/json-ld.tsx`)
- Helpers schema.org typés dans `apps/storefront/src/lib/seo/schemas/`
- Validation systématique via https://validator.schema.org avant commit
- Test rich results via https://search.google.com/test/rich-results
- Commit conventionnels : `feat(seo): ...`, `fix(seo): ...`
- Branche `develop`, PR vers `main`

## Ce qui reste HORS de cette série (actions non-code)

Ces items sont critiques mais ne se font pas par Claude Code — à ne pas oublier :

- **Google Merchant Center** : création compte, verification domaine,
  upload feed (le prompt 01 génère juste le feed accessible sur
  `https://lehena.fr/feed/google-merchant.xml`, mais l'upload est manuel)
- **Google Business Profile** : cf. `docs/refonte/gbp-runbook.md`, aucune
  action code
- **Backlinks pitching** : outreach presse / blogs (Chef Simon, Cuisine
  Actuelle, Sud-Ouest, office de tourisme Pays Basque)
- **Rédaction des piliers** (6 pages 2000-4000 mots) — job copywriter,
  puis on intègre via le CMS Pages
- **Reviews collecte** : campagne emailing J+10 déjà branchée (Phase 6),
  suivre le volume et transférer vers Google Reviews / Trustpilot manuellement

## Comment utiliser chaque prompt

1. Ouvre Claude Code dans `/Users/paul/Apps/Lehena`, sur branche `develop`
2. Copie-colle **intégralement** le bloc "PROMPT À COPIER-COLLER" du fichier
3. **Laisse Claude Code poser ses questions** — chaque prompt est conçu pour
   ça, ne bypass pas
4. Valide ses choix techniques, puis dis-lui de procéder
5. Teste ce qu'il a livré (chaque prompt a une checklist)
6. Commit conventionnel + push
7. Attends CI verte + déploiement Watchtower
8. Valide en prod avec les outils listés dans la checklist

## Si Claude Code part en vrille

Cf. `docs/refonte/README.md` § "Si Claude Code part en vrille" — même logique.
