# Observability — guide opérateur

Que faire quand une alerte tombe ? Où regarder pour comprendre quoi.

---

## 1. Stack en place (Phase 12)

| Outil                          | Rôle                                   | URL                         |
| ------------------------------ | -------------------------------------- | --------------------------- |
| **Plausible**                  | Trafic + funnel e-commerce             | `plausible.io/lehena.fr`    |
| **Sentry**                     | Erreurs front + back, sourcemaps       | `sentry.io/lehena`          |
| **Pino logs**                  | Logs structurés backend (stdout, JSON) | Railway / Hetzner dashboard |
| **/health**                    | Liveness + dépendances                 | `lehena.fr/api/health`      |
| **UptimeRobot / Better Stack** | Monitor `/health` toutes les 60 s      | Email + Slack               |

## 2. Plausible — événements e-commerce

Custom events émis depuis le storefront via `trackEvent()` (`lib/analytics/plausible.ts`) :

| Event                  | Quand                                | Props                                    |
| ---------------------- | ------------------------------------ | ---------------------------------------- |
| `view_item`            | PDP loaded                           | `product_handle`                         |
| `add_to_cart`          | bouton add → succès                  | `product_handle`, `variant`, `price`     |
| `begin_checkout`       | tunnel ouvert                        | `cart_total`                             |
| `purchase`             | confirmation order                   | `order_id` + revenue (currency + amount) |
| `subscribe_newsletter` | submit form newsletter               | `source_slug`                            |
| `signup`               | new account created                  | —                                        |
| `subscribe_box`        | Stripe Checkout subscription success | `plan_slug`                              |

Configurer ces events comme **Goals** dans Plausible (UI → Goals → Add).
Pour le funnel principal : Goals → Funnels → "view_item → add_to_cart → begin_checkout → purchase".

## 3. Sentry — réagir à une alerte

1. **Triage** : Sentry envoie un email à `dev@lehena.fr` quand une nouvelle issue apparaît. Ouvrir l'issue.
2. **Contexte** : Sentry affiche la stack trace, l'URL, le user agent. Aucune PII (pas d'email, pas d'IP — strippé par `beforeSend`).
3. **Cause probable** :
   - `[medusa-backend]` issue → regarder logs Pino correspondants (filtrer par request_id si présent dans le payload Sentry).
   - `[lehena-storefront]` issue → regarder Vercel/Railway logs storefront + tester le scénario en repro.
4. **Mute** des issues bruyantes via Sentry UI (extension navigateur custom, bots…). Ne PAS désactiver Sentry globalement.

## 4. Pino logs — backend

Format : JSON ligne par ligne, stdout. Chaque entrée porte :

- `service: "lehena-backend"`
- `env: "production" | "staging" | …`
- `level: "info" | "warn" | "error"`
- `request_id` (si à l'intérieur d'une requête HTTP)
- payload spécifique

Pour grep en prod :

```sh
# Toutes les erreurs 5xx des 24h sur Railway :
railway logs --tail 24h | jq 'select(.level == "error")'

# Toutes les actions d'un customer particulier (via subscription) :
railway logs --tail 24h | jq 'select(.customer_id == "cus_01...")'
```

En dev : `pino-pretty` est activé automatiquement quand `NODE_ENV !== "production"`. Format lisible humain.

## 5. /health

- `GET /health` → backend (Postgres + event bus). 200 / 503.
- `GET /api/health` → storefront (front + ping backend). 200 / 503.

À pinger toutes les 60 s depuis UptimeRobot / Better Stack. Si l'alerte tombe :

1. Vérifier le dashboard plateforme (Railway/Hetzner) — service down ?
2. Vérifier le payload JSON de `/health` — `checks.postgres: "fail"` ? rollback récent ?
3. Si rolling restart en cours → laisser passer, monitorer 5 min, ré-alerter si pas resolved.

## 6. Variables d'environnement

| Var                            | Rôle                                                 |
| ------------------------------ | ---------------------------------------------------- |
| `SENTRY_DSN`                   | Backend Sentry. Absent = no-op.                      |
| `SENTRY_ENVIRONMENT`           | "production", "staging", "preview"…                  |
| `SENTRY_RELEASE`               | SHA du commit, injecté par le déploiement (Phase 13) |
| `NEXT_PUBLIC_SENTRY_DSN`       | Storefront client-side Sentry                        |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | "lehena.fr" — sans ça le script ne se charge pas     |
| `LOG_LEVEL`                    | Pino level (défaut "info")                           |

## 7. Erreurs courantes

- ❌ Sourcemaps Sentry pas uploadés → erreur affiche du JS minifié. Phase 13 wire l'upload via `@sentry/cli` au build.
- ❌ PII dans les logs → vérifier le `redact` config (lib/logger.ts), ajouter les nouveaux champs sensibles.
- ❌ Plausible bloqué par adblockers → normal, le funnel reste représentatif sur 70-80% du trafic.
- ❌ Healthcheck trop strict (MeiliSearch in `/health`) → fait une PR pour le déplacer vers `/health/full`. Le monitor doit pinger `/health` seul.

## 8. Tableau de bord recommandé

À reviewer hebdo (le lundi matin) :

1. **Plausible** : sessions, taux de conversion (purchase / sessions), pages les plus visitées
2. **Sentry** : nombre d'issues open, p95 erreurs/jour
3. **Health monitor** : uptime semaine (cible 99,9 %)
4. **Pino logs** : volume `error` derniers 7j (cible : décroissant)
