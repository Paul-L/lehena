# Rotation des secrets

Catalogue des secrets utilisés en prod et fréquence de rotation. Référence
opérateur ; consulté avant chaque rotation pour ne rien casser.

> Règle d'or : un secret n'est jamais commité, jamais loggé, jamais
> partagé hors d'un coffre (1Password / Bitwarden / Doppler).

---

## 1. Inventaire

| Secret                                      | Où ça vit                        | Rotation cible                       | Procédure                                             |
| ------------------------------------------- | -------------------------------- | ------------------------------------ | ----------------------------------------------------- |
| `JWT_SECRET`                                | Railway env                      | Annuelle ou compromission            | Cf. §2                                                |
| `COOKIE_SECRET`                             | Railway env                      | Annuelle ou compromission            | Cf. §2                                                |
| `PREVIEW_SECRET`                            | Railway env + Vercel env         | Annuelle                             | Cf. §3                                                |
| `REVALIDATE_SECRET`                         | Railway env + Vercel env         | Annuelle                             | Cf. §3                                                |
| `MAGIC_LINK_SECRET`                         | Railway env                      | Annuelle                             | Cf. §2                                                |
| `DATABASE_URL` (mot de passe postgres)      | Railway env (managé par Railway) | Sur demande                          | Régénérer dans Railway DB, ne touche aucun code       |
| `REDIS_URL` (idem)                          | Railway env                      | Sur demande                          | idem                                                  |
| `STRIPE_API_KEY` (live + test)              | Railway env                      | À chaque compromission, sinon stable | Stripe dashboard → API keys → Roll                    |
| `STRIPE_WEBHOOK_SECRET`                     | Railway env                      | Sur reconfig endpoint                | Stripe dashboard → Webhooks → Reveal                  |
| `STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET`       | Railway env                      | idem                                 | idem                                                  |
| `RESEND_API_KEY`                            | Railway env                      | Annuelle                             | Resend dashboard → API Keys → Create new + delete old |
| `RESEND_WEBHOOK_SECRET`                     | Railway env                      | Sur reconfig endpoint                | Resend dashboard → Webhooks                           |
| `MEILISEARCH_API_KEY`                       | Railway env                      | Annuelle                             | Meili : régénérer la master key, propager aux clients |
| `MEILISEARCH_SEARCH_KEY`                    | Railway + Vercel env             | Annuelle                             | dérivée de la master, à régénérer derrière            |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Railway env                      | Annuelle                             | Scaleway console → IAM → Rotate                       |
| `SENTRY_DSN`                                | Railway env                      | Stable (pas de rotation requise)     | —                                                     |
| `SENTRY_AUTH_TOKEN`                         | GitHub Actions secret            | Annuelle                             | Sentry → Auth Tokens → New                            |
| `WC_API_CONSUMER_KEY` / `_SECRET`           | Local + ephemeral pour migration | Une fois Phase 8 done                | Révoquer immédiatement après migration                |
| `ALMA_API_KEY` (post-V1)                    | Railway env                      | Annuelle                             | Alma dashboard                                        |
| `BREVO_API_KEY` (post-V1)                   | Railway env                      | Annuelle                             | Brevo dashboard                                       |
| Vercel deploy tokens                        | Vercel UI                        | Annuelle ou départ d'employé         | Vercel Settings → Tokens                              |

## 2. Rotation d'un secret JWT (ou cookie / magic-link)

Ces secrets signent des tokens qui survivent à la rotation (max 30 jours
pour le magic link, 1 h pour gdpr-delete, etc.). Procédure :

1. Générer le nouveau secret : `openssl rand -base64 64`.
2. Mettre à jour Railway env (variable, **pas** Redéployer pour
   l'instant).
3. **Window de transition** — option A (la plus simple) : on accepte
   d'invalider tous les tokens actifs (les clients refont un login). À
   prévenir l'équipe / la liste.
4. Redéployer le backend.
5. Surveiller les logs / Sentry pour les erreurs `JsonWebTokenError`
   (signatures invalides qui datent d'avant la rotation).

> Option B (zero-downtime) : tenir 2 secrets simultanément (JWT
> verification trie sur la signature). Pas implémenté V1 — overkill.

## 3. Rotation d'un secret partagé Backend + Storefront

Ces secrets sont en double dans Railway **et** Vercel :

- `PREVIEW_SECRET` (Medusa signe le JWT, Vercel l'attend dans le
  `x-preview-token` header)
- `REVALIDATE_SECRET` (Medusa signe les requêtes vers `/api/revalidate`)
- `MEILISEARCH_SEARCH_KEY` (Medusa la génère, le storefront l'utilise
  côté client)

Procédure :

1. Mettre à jour côté backend (Railway), garder l'ancien temporairement
   dans un alias `PREVIEW_SECRET_OLD` si l'app le supporte.
2. Mettre à jour côté storefront (Vercel).
3. Re-déployer le storefront en premier.
4. Re-déployer le backend.
5. Retirer l'alias `_OLD` après 24 h.

## 4. Que faire en cas de compromission

1. **Révoquer** le secret côté provider (Stripe Roll, Resend delete,
   Scaleway revoke).
2. **Régénérer** un nouveau secret.
3. **Pousser** vers Railway/Vercel env.
4. **Redéployer** la stack.
5. **Audit** Sentry/Plausible/Stripe pour activité suspecte sur la
   période d'exposition.
6. **Documenter** l'incident dans un fichier `incidents/YYYY-MM-DD-<sujet>.md`.

## 5. Audit annuel

Tous les ans, en janvier :

- [ ] Lister tous les secrets via `railway variables list` + Vercel
      dashboard
- [ ] Comparer avec ce document — toute variable orpheline doit être
      ajoutée ici ou supprimée
- [ ] Pour chaque secret avec rotation annuelle : noter la dernière
      date de rotation dans un fichier `secrets-last-rotated.csv`
- [ ] Re-vérifier qui a accès à Railway / Vercel / Scaleway / Stripe
      (départs d'employés ? presta ?)
