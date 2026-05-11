# Passe 01 — Setup et contexte initial

## Objectif de cette passe

Donner à Claude Code tout le contexte projet nécessaire avant de commencer à
coder. Pas de génération de code dans cette passe : c'est de la
reconnaissance et de la validation d'environnement.

---

## PROMPT À COPIER-COLLER

```
Je vais te demander dans les prochains messages de créer un module "Pages
éditoriales" pour Medusa v2 avec un éditeur TipTap, plus l'intégration côté
storefront Next.js. Avant de commencer à coder, je veux qu'on cale le
contexte ensemble.

## Étape 1 : Reconnaissance du projet

Explore les deux repos présents dans le workspace et réponds aux questions
suivantes :

1. Quelle version exacte de Medusa est installée (regarder package.json du
   backend) ?
2. Quelle version de Next.js côté storefront ? App router ou pages router ?
3. Quel est le file/storage service configuré dans Medusa
   (local, S3, MinIO, autre) ? Ça déterminera comment on gérera l'upload
   d'images dans l'éditeur.
4. Y a-t-il déjà des modules custom dans `src/modules/` ? Si oui, lesquels ?
5. Y a-t-il déjà des extensions admin dans `src/admin/` ? Si oui, lesquelles ?
6. Quelle est la version de TypeScript et la config tsconfig (strict ou pas) ?
7. Tailwind est-il configuré côté storefront ? Avec quel preset ?
8. Y a-t-il un système de tests en place (jest, vitest) ?

Présente-moi le résultat sous forme de tableau récapitulatif.

## Étape 2 : Choix techniques à valider avec moi

Sur la base de ta reconnaissance, propose-moi tes choix pour les points
suivants — ne code rien, présente juste tes recommandations avec une
justification courte (2-3 lignes max par point) :

1. **Format de stockage du contenu TipTap** : JSON (recommandé pour rééditer
   sans perte) ou HTML sérialisé ? Lequel choisis-tu et pourquoi ?
2. **Rendu côté storefront** : `generateHTML` de @tiptap/html côté serveur,
   ou un renderer React custom qui mappe les nodes TipTap vers des composants
   React ? Lequel donne le meilleur SEO + flexibilité de styling ?
3. **Gestion du multilingue** : on prévoit dès maintenant un champ `locale`
   sur l'entité Page. Comment structures-tu les traductions : une row par
   langue (avec un `translation_group_id` qui lie les versions), ou un champ
   JSON `translations` sur la row principale ? Justifie.
4. **Soft delete vs hard delete** : Medusa v2 supporte le soft delete via le
   DAL. Recommandes-tu le soft delete pour les pages, et pourquoi ?
5. **Auto-save côté admin** : debounce de combien (15s, 30s, 60s) ?
   Sauvegarde silencieuse ou avec indicateur visuel ?
6. **Upload d'images dans TipTap** : on passe par le file service Medusa via
   une API admin custom (`POST /admin/uploads`), ou on s'appuie sur une route
   existante ? Vérifie ce que Medusa v2 expose nativement.

## Étape 3 : Plan d'attaque

Une fois mes réponses validées, propose-moi un plan en 6 passes
(numérotées, avec pour chaque passe : objectif, fichiers créés, livrable
testable). Confirme que tu es aligné sur ce découpage avant qu'on commence.

## Contraintes globales pour toutes les passes à venir

- TypeScript strict, zéro `any`, types exhaustifs
- Validation zod sur TOUS les inputs API (admin et store)
- Erreurs : `MedusaError` avec les bons types
- Workflows Medusa pour les opérations à effets de bord (publication →
  update + event + revalidation)
- Pas de logique métier dans les routes API : tout passe par le service
  ou les workflows
- Commits conventionnels après chaque passe (`feat(pages): ...`)
- README à jour à chaque passe qui ajoute une fonctionnalité majeure

## Ce que tu NE fais PAS dans cette passe

- Tu ne crées AUCUN fichier
- Tu ne modifies AUCUN fichier
- Tu te contentes d'explorer, analyser, et proposer

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Tableau récapitulatif du projet présent
- [ ] Les 6 choix techniques sont justifiés et tu es d'accord avec eux
- [ ] Le plan d'attaque en 6 passes est cohérent avec les fichiers
      `02-` à `07-` de cette série
- [ ] Aucun fichier n'a été créé ou modifié

Si Claude propose un découpage différent du tien, c'est OK — adapte les
passes suivantes. L'important c'est que vous soyez alignés.
