# Module Pages pour Medusa v2 — Série de prompts Claude Code

Cette série découpe la création d'un module **Pages éditoriales** (avec éditeur
TipTap, gestion drafts/publication, et rendu Next.js) en passes indépendantes
et vérifiables.

## Pourquoi découper ?

Un seul gros prompt qui demande tout d'un coup donne souvent un résultat
moyen : Claude Code perd le focus, mélange les couches, génère du code
non-testé. En découpant en passes, tu gardes le contrôle, tu valides chaque
brique avant de continuer, et tu peux corriger le tir sans tout refaire.

## Ordre d'exécution

| # | Fichier | Objectif | Durée estimée |
|---|---------|----------|---------------|
| 0 | `00-README.md` | Ce fichier | — |
| 1 | `01-setup-and-context.md` | Préparer le repo et donner le contexte initial à Claude Code | 5 min |
| 2 | `02-backend-module.md` | Créer le module Medusa : entité, service, API, workflows, subscribers | 45-90 min |
| 3 | `03-admin-tiptap-editor.md` | Créer le composant éditeur TipTap isolé (réutilisable) | 30-45 min |
| 4 | `04-admin-pages-ui.md` | Créer les routes admin (liste + édition) qui utilisent l'éditeur | 30-45 min |
| 5 | `05-storefront-rendering.md` | Créer la route Next.js `[slug]` + revalidation ISR | 20-30 min |
| 6 | `06-seed-and-docs.md` | Seed de pages d'exemple + README projet | 15 min |
| 7 | `07-test-and-validate.md` | Plan de test manuel end-to-end | 30 min |

## Prérequis avant de commencer

1. Repos prêts :
   - Backend Medusa v2 initialisé (`npx create-medusa-app@latest`)
   - Storefront Next.js (le starter Medusa Next.js fait l'affaire)
2. PostgreSQL et Redis qui tournent (en local via Docker, ou sur ton VPS)
3. Claude Code installé et configuré
4. (Recommandé) MCP Medusa et plugin ecommerce-storefront installés :
   ```bash
   claude
   /plugin marketplace add medusajs/medusa-agent-skills
   /plugin install ecommerce-storefront@medusa
   ```

## Comment utiliser chaque prompt

1. Ouvre Claude Code dans ton workspace (qui contient backend + storefront)
2. Copie-colle le contenu du prompt en commençant par `01-setup-and-context.md`
3. **Laisse Claude poser ses questions de clarification** avant qu'il code
4. Valide ses choix architecturaux puis dis-lui de procéder
5. À la fin de la passe, **teste** ce qu'il a livré avant de passer à la suivante
6. Si quelque chose cloche, demande-lui de corriger AVANT d'enchaîner — un bug
   dans la passe 2 va se propager dans toutes les suivantes

## Conventions utilisées dans tous les prompts

- **TypeScript strict** partout, zéro `any`
- **Validation zod** pour tous les inputs API
- **Workflows Medusa** pour les opérations à effets de bord
- **Tests** : un test par route API critique
- **Commits** conventionnels après chaque passe (`feat(pages): ...`)

## Variables d'environnement à prévoir

À ajouter dans `.env` (backend) :
```
REVALIDATE_SECRET=un-secret-aleatoire-long
PREVIEW_SECRET=un-autre-secret-long
STOREFRONT_URL=http://localhost:8000
```

À ajouter dans `.env.local` (storefront) :
```
REVALIDATE_SECRET=le-meme-secret-que-backend
PREVIEW_SECRET=le-meme-secret-que-backend
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
```

## Si tu bloques

Si Claude Code part en vrille sur une passe :
1. Stoppe-le
2. Demande-lui de résumer ce qu'il a fait et ce qui ne marche pas
3. Reformule la passe avec plus de contraintes (ex : "ne touche pas aux fichiers
   X et Y, focus uniquement sur Z")
4. Au pire, reset la passe (`git reset --hard`) et recommence avec un prompt affiné
