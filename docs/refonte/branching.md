# Branching & PR — Refonte Lehena

> Modèle Git pour toute la durée de la refonte. Référence : `README.md`
> § "Comment utiliser chaque prompt".

## Branches

| Branche                                          | Rôle                                                                                    | Protection                               |
| ------------------------------------------------ | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| `main`                                           | Production. Tag de release après bascule (Phase 14).                                    | Protégée, PR requise, CI verte, 1 review |
| `develop`                                        | Intégration continue. Cible par défaut des PR de feature.                               | Protégée, CI verte                       |
| `feat/phase-N-<slug>`                            | Travail par phase du plan (`feat/phase-0-fondations`, `feat/phase-1-modele-metier`, …). | Aucune                                   |
| `fix/<slug>`                                     | Correctifs hors phase.                                                                  | Aucune                                   |
| `chore/<slug>`, `docs/<slug>`, `refactor/<slug>` | Travail technique ou doc isolé.                                                         | Aucune                                   |

### Flux

1. Brancher `feat/phase-N-<slug>` depuis `develop` à jour.
2. Travailler en commits granulaires (cf. § Commits ci-dessous).
3. Push + ouvrir PR vers `develop`. Cocher la checklist du template.
4. CI verte + review → merge (squash autorisé pour les petites passes, merge commit pour les phases qui regroupent plusieurs commits logiques).
5. Quand `develop` agrège plusieurs phases validées (typiquement un sprint), PR `develop → main` pour préparer une release. Tag `vYYYY.MM.DD` ou semver.
6. Si correctif urgent en prod : branche `fix/<slug>` depuis `main`, PR vers `main`, **puis** backport vers `develop`.

## Commits — Conventional Commits

Format strict imposé par `commitlint` (hook `commit-msg`) :

```
<type>(<scope>): <subject>

[body optionnel]

[footer optionnel — Co-Authored-By, etc.]
```

| Type       | Quand l'utiliser                                     |
| ---------- | ---------------------------------------------------- |
| `feat`     | Nouvelle feature utilisateur                         |
| `fix`      | Correctif de bug                                     |
| `chore`    | Tooling, infra, deps, env                            |
| `docs`     | Documentation seule (refonte/, README, ADR)          |
| `refactor` | Réorganisation sans changement fonctionnel           |
| `perf`     | Optimisation mesurable                               |
| `test`     | Ajout/modification de tests                          |
| `build`    | Système de build (Dockerfile, turbo.json structurel) |
| `ci`       | Workflows GitHub Actions                             |
| `revert`   | Revert d'un commit précédent                         |

Scope recommandé : nom du module (`pages`, `checkout`, `pdp`), de l'app (`backend`, `storefront`), ou de la phase (`phase-0`, `phase-3`). Le scope est libre tant que l'en-tête fait moins de 100 caractères.

### Exemples

```
feat(pdp): add lehena gallery zoom
fix(checkout): clear stale shipping option on region change
chore(phase-0): foundations — docker compose dev, CI, lint, husky, ADRs
docs(refonte): add ADR-003 on MeiliSearch indexing strategy
ci(github): add Lighthouse CI smoke on PR
```

### Granularité

- 1 commit ≈ 1 idée logique. Préférable à un gros commit "Phase X done".
- Le **commit final de phase** récapitule (ex: `chore(phase-0): foundations — final`), c'est lui qu'on cite dans la PR. Pas obligatoire si l'historique est déjà lisible.
- Co-author via `Co-Authored-By:` dans le footer si Claude Code a participé.

## Pull Requests

Cible : `develop` par défaut. Cible `main` uniquement pour merge de release ou hotfix.

Le template `.github/pull_request_template.md` impose :

- Résumé / motivation
- Captures d'écran si UI
- Plan de test
- Checklist : typecheck, lint, build, accessibilité, SEO si applicable
- Lien vers l'issue / le prompt de phase concerné

Pas de merge sans :

- CI verte
- 1 review approuvée (ou auto-merge documenté)
- Branche à jour avec la cible (rebase ou merge OK selon préférence du reviewer)
