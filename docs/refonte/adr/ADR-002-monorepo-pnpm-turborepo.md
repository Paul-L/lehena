# ADR-002 — Monorepo pnpm + Turborepo

- **Status** : Accepted
- **Date** : 2026-05-11
- **Phase concernée** : Phase 0 — Fondations

## Contexte

Le repo est déjà structuré en monorepo `pnpm` workspaces (`apps/backend`,
`apps/storefront`) avec Turborepo en orchestrateur. La question : on
conserve, on change, ou on simplifie ?

Critères :

- Partage de tooling (ESLint, Prettier, TS, hooks).
- Vitesse d'install + build local et CI.
- Capacité à dédupliquer React (le storefront tourne en RSC React 19, le
  backend admin embarque aussi React).
- Confort dev : `pnpm dev` boot les deux apps en une commande.
- Compatibilité Medusa v2 (qui attend une structure standard côté backend).

## Décision

On garde **pnpm 10 + Turborepo 2** tel quel.

- `pnpm` est pinné via `"packageManager": "pnpm@10.12.4"` au root.
- `pnpm.overrides` au root force `react: 19.0.5` / `react-dom: 19.0.5` pour
  dédupliquer (commit `8632613`). Cela couvre le backend dont l'admin
  embarque React, et évite les bugs "two reacts" dans les widgets admin.
- `turbo.json` orchestre `dev`, `build`, `start`, `lint`, `typecheck`,
  `clean` avec cache local.
- `pnpm install --frozen-lockfile` est la règle en CI.

## Alternatives considérées

- **Yarn 4 workspaces** — équivalent fonctionnel mais retour en arrière côté équipe ; pnpm est déjà installé et le lockfile est stable.
- **Nx** — overkill pour 2 apps. Turborepo couvre largement le besoin, courbe plus douce.
- **Repos séparés** (`lehena-backend` + `lehena-storefront`) — perd la cohérence du tooling, dédoublement des CI, partage de types/SDK plus pénible. Écarté.
- **pnpm sans Turborepo** — `pnpm -r` couvre 70 % du besoin mais perd le cache. Turbo apporte de la vraie valeur en CI (cache distant possible plus tard).

## Conséquences

### Positives

- Aucun changement = aucun risque ni temps perdu.
- React dédupliqué une fois pour toutes via overrides.
- Tooling racine (ESLint flat config, Prettier, Husky, lint-staged) bénéficie aux deux apps sans duplication.

### Négatives / dettes

- Le `pnpm-lock.yaml` du repo est gros (1810 packages résolus). Acceptable.
- Le warning peer `react-remove-scroll` (dépendance transitive Medusa admin → @types/react 18) reste tant que Medusa n'a pas bumpé. Bénin, on l'ignore.

### Suivi

- Si on ajoute un package partagé (`packages/sdk`, `packages/email`), on créera un dossier `packages/` au prochain besoin. Pas avant.
- Si le cache Turbo distant devient pertinent (CI lente), on activera Vercel Remote Cache (gratuit jusqu'à un certain seuil).
