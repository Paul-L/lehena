# Monitoring J0 → J+7

Surveillance renforcée pendant la première semaine. Toutes les
checks documentés ici, avec leur cadence et leur seuil d'alerte.

---

## Sentry — sampling à 100 % pendant 7 jours

Phase 12 configure 10 % de traces en prod (économie). **À la bascule**,
passer à 100 % pour ne rien rater des erreurs early-adopters :

```env
# Railway prod env vars, à modifier J0 + restaurer à J+7
SENTRY_TRACES_SAMPLE_RATE=1.0
```

(Si la conf n'est pas paramétrable, hardcoder temporairement
`tracesSampleRate: 1.0` dans `instrumentation.ts` + revert J+7.)

## Checks horaires J0

Toutes les heures, jusqu'à T+12h :

- [ ] Plausible : nombre de sessions live
- [ ] Sentry : nouvelles issues ouvertes
- [ ] UptimeRobot : monitor /health backend + storefront vert
- [ ] Stripe dashboard : commandes captured, webhooks OK
- [ ] Resend dashboard : emails envoyés, taux bounce < 1 %

Saisir un rapport rapide dans Slack #lehena-refonte toutes les
2 heures pendant les 12 premières heures.

## Checks J+1

À la première heure ouvrée du jour suivant :

- [ ] **Trafic** : comparer à J-1 (ancien site).
  - Baisse de 20-40 % normale pendant la phase d'indexation.
  - Baisse > 60 % → investigation (DNS pas propagé partout ? Robots
    bloqués ?).
- [ ] **Conversions** : ratio purchase / sessions cohérent avec
      l'ancien site (≥ 80 % attendu en V1).
- [ ] **Sentry** : nombre d'issues ouvertes + traitement P0/P1.
- [ ] **Search Console** : ajouter la propriété "lehena.fr" (si pas
      déjà fait J-7), soumettre le sitemap.
- [ ] **Plausible Goals** : vérifier que les 5 events apparaissent
      (view_item, add_to_cart, begin_checkout, purchase, signup).

## Checks J+3

- [ ] **Search Console Couverture** : vérifier que les redirects 301
      WP → Medusa sont reconnus (statut "Excluded by redirect" attendu
      pour les anciennes URLs).
- [ ] **Sentry trends** : volume erreurs en baisse vs J0 ?
- [ ] **Conversions** : suivi quotidien depuis J0.
- [ ] **Avis clients** : revue des emails / réseaux sociaux,
      identifier les sujets récurrents.

## Checks J+7

Bilan complet :

- [ ] **Positions Google** : check via Search Console les 10
      mots-clés principaux (jambon basque, jambon Orhi, charcuterie
      artisanale, …). Baisse temporaire normale, mais > 50 % = alerte.
- [ ] **Trafic organique** : comparer aux 7 jours pré-bascule.
- [ ] **Pages performantes** : top 20 pages visitées. Recoupent-elles
      avec l'ancien site ?
- [ ] **Pages problème** : pages avec taux de rebond > 80 % ou temps
      passé < 10 s. Investiguer.
- [ ] **Crons** : abandoned-cart, review-request, stock-low,
      ddm-short ont-ils tourné chaque jour ?
- [ ] **Backup** : test de restauration du dump J0 sur staging (cf.
      `deploy.md` §5).

## Sentry sampling : retour à 10 %

À J+7 :

```env
SENTRY_TRACES_SAMPLE_RATE=0.1
```

## Seuils d'alerte (à configurer sur Sentry / UptimeRobot)

| Métrique                | Cadence   | Seuil alerte                 |
| ----------------------- | --------- | ---------------------------- |
| /health backend         | 60 s      | down > 2 min → email + Slack |
| /health storefront      | 60 s      | down > 2 min → email + Slack |
| Sentry issues P0        | live      | nouvelle issue → Slack       |
| Stripe webhook failures | 5 min     | > 3 retries → Slack          |
| Conversion / sessions   | quotidien | baisse > 50 % vs J-1 → email |

## Logs Pino — ce qu'il faut chercher

```sh
# Erreurs 5xx des 24h
railway logs --tail 24h | jq 'select(.level == "error")'

# Tous les /health 503
railway logs --tail 24h | jq 'select(.req.url == "/health" and .res.statusCode == 503)'

# Recherche d'un customer en particulier (par email)
railway logs --tail 24h | jq 'select(.customer_email == "marie.dupont@example.com")'
```

## Post-mortem

À J+7 ou J+10 (après stabilisation), rédiger
`docs/refonte/post-mortem.md` (template fourni).
