<!--
  Template PR Lehena. Cible par défaut: `develop`.
  Réfère à la phase du plan: docs/refonte/00-PLAN.md.
-->

## Quoi

<!-- En 1-2 phrases : qu'est-ce que cette PR ajoute / change / supprime ? -->

## Pourquoi

<!-- Motivation : phase du plan, ticket, demande métier, bug. -->

Phase concernée : <!-- ex: Phase 0 — Fondations -->

## Comment

<!-- Approche technique : décisions clés, alternatives écartées, fichiers à regarder en priorité. -->

## Captures (UI uniquement)

<!-- Avant / après si visible côté storefront ou admin. -->

## Plan de test

- [ ]
- [ ]

## Checklist

- [ ] `pnpm typecheck` passe
- [ ] `pnpm lint` passe
- [ ] `pnpm build` passe
- [ ] Variables d'env nouvelles ajoutées à `apps/{backend,storefront}/.env.example` avec commentaire
- [ ] ADR ajouté si choix structurant (`docs/refonte/adr/`)
- [ ] Documentation à jour (README de l'app ou doc dédiée)
- [ ] Accessibilité vérifiée si UI (clavier, contraste, ARIA)
- [ ] SEO embarqué si page indexable (cf. `docs/refonte/strategie-seo.md` § 11)
- [ ] Pas de secret en clair commité
