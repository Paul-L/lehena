# Phase 12 — Analytics, monitoring, observabilité

## Objectif de cette passe

Brancher Plausible (events e-commerce + funnel), Sentry (front + back),
logs structurés pino côté backend, healthchecks + alertes uptime. Optionnel
selon avis Paul : GTM pour campagnes Meta / Google Ads (avec bandeau
consentement granulaire).

C'est la phase qui rend la prod **pilotable** au quotidien — sans elle, on
ne sait pas si le site marche, encore moins pourquoi il marche.

---

## PROMPT À COPIER-COLLER

```
On démarre la **Phase 12 — Analytics & monitoring** de la refonte Lehena.
Lis :

1. `docs/refonte/00-PLAN.md` (Phase 12 § 3)
2. `docs/refonte/strategie-seo.md` (§ 9 — Tracking, attribution, RGPD)

Confirme avoir lu.

## Étape 1 — Reconnaissance

- Y a-t-il déjà un script analytics côté storefront ?
- Sentry installé sur l'une des deux apps ?
- Y a-t-il un logger défini côté backend (au-delà du `console.log`) ?
- Y a-t-il un endpoint healthcheck `/health` ?

## Étape 2 — Choix techniques à valider

a. **Plausible** :
   - Snippet officiel injecté dans `app/layout.tsx`, `data-domain="lehena.fr"`.
   - Custom events e-commerce via API Plausible :
     - `view_item` (PDP vue)
     - `add_to_cart`
     - `begin_checkout`
     - `purchase` (avec `revenue` paramètre)
     - `subscribe_newsletter`
     - `signup`
   - Funnel principal : `view_item → add_to_cart → begin_checkout → purchase`.
   - Goals configurés dans Plausible avec valeur monétaire pour purchase.
   - Recommande l'auto-hébergement vs SaaS Plausible (SaaS = simplicité,
     auto-hosting = coût zéro mais maintenance).

b. **Sentry** :
   - Storefront : `@sentry/nextjs` avec instrumentation client + server +
     edge. Sourcemaps uploadés au build.
   - Backend : `@sentry/node` initialisé dans `apps/backend/src/instrumentation.ts`.
   - Sampling rate : 100 % erreurs, 10 % traces en prod.
   - PII : strip automatique email / IP via `beforeSend`.
   - Release tag par commit sha pour tracking déploiements.

c. **Logs structurés** :
   - `pino` côté backend, format JSON, niveau `info` par défaut, `debug`
     via env.
   - Champ `request_id` injecté via middleware Medusa (génère UUID v4 par
     requête).
   - Sortie : stdout en prod (à scraper par Railway/Hetzner), Better Stack
     ou Grafana Cloud pour le dashboard.

d. **Healthchecks** :
   - Backend : `GET /health` qui check Postgres + Redis + S3 + MeiliSearch,
     retourne 200 si tout OK, 503 sinon.
   - Storefront : `GET /api/health` qui ping le backend `/health`.

e. **Alertes uptime** :
   - UptimeRobot (gratuit) ou Better Stack (gratuit jusqu'à 10 monitors) :
     check `/health` toutes les minutes, alerte email + Slack si down 2 min.

f. **GTM (optionnel)** :
   - Si on intègre, charger uniquement après consentement utilisateur
     (bandeau RGPD granulaire).
   - 3 catégories de consentement : Analytics (Plausible — coché, sans
     cookie donc pas besoin de consentement strict), Marketing (Meta Pixel,
     Google Ads, TikTok pixel), Personnalisation (cookies de profilage).
   - À arbitrer avec Paul si V1 ou V2.

g. **Cookie banner** :
   - Si GTM activé : bandeau granulaire (Accepter tout / Refuser tout /
     Personnaliser). Sans GTM, pas de bandeau (Plausible non intrusif).
   - Lib recommandée : `@klaro/klaro` ou implémentation maison simple.

## Étape 3 — Plan détaillé

5-7 sous-passes :

- A : Plausible installé + events e-commerce.
- B : Sentry front + back + sourcemaps + release tagging.
- C : Logs pino + request_id.
- D : Healthchecks back et front.
- E : Alertes uptime configurées.
- F : (si arbitrage) GTM + bandeau consentement.
- G : Dashboard "santé du site" documenté (où aller voir quoi).

## Étape 4 — Implémentation

- Branche `feat/phase-12-analytics-monitoring`.
- Tester chaque event Plausible manuellement et vérifier dans le dashboard.
- Provoquer une erreur Sentry test sur staging et vérifier la réception.
- `docs/refonte/observability.md` : guide de "comment réagir à une alerte"
  pour l'équipe.

## Contraintes (rappel)

- Pas de PII dans les events Plausible (email, nom).
- Pas de PII dans les logs (mask via middleware).
- Sentry beforeSend strip PII.

## Ce que tu NE fais PAS

- Pas de A/B testing (V2).
- Pas de Heatmap (Hotjar : intrusif, coûteux, à arbitrer V2).
- Pas de session replay (RGPD complexe).

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Plausible reçoit les events `view_item`, `add_to_cart`,
      `begin_checkout`, `purchase` lors d'une commande test.
- [ ] Funnel visible dans Plausible avec taux de conversion par étape.
- [ ] Sentry reçoit une erreur test depuis le storefront et depuis le backend.
- [ ] Sourcemaps Sentry uploadés (l'erreur affiche le code source, pas du
      JS minifié).
- [ ] Logs backend en JSON, `request_id` présent.
- [ ] `/health` répond 200 quand tout OK, 503 si Postgres arrêté.
- [ ] UptimeRobot/Better Stack monitor configuré, alerte Slack/email reçue
      sur down test.
- [ ] `docs/refonte/observability.md` rédigé.

## Pièges courants

- **Plausible custom events** : si tu surcharges le script avec des middleware
  Tag Manager, attention à l'ordre. Charger Plausible en premier.
- **Sentry sourcemaps** : oubli classique. Vérifier qu'une erreur en prod
  staging affiche le code TS, pas du JS minifié.
- **Pino logs en dev** : utiliser `pino-pretty` en dev, pas en prod.
- **Healthcheck trop strict** : si tu mets MeiliSearch dans le `/health`
  et que MeiliSearch redémarre 30s, ton site est marqué "down" alors qu'il
  est utilisable en mode dégradé. Faire 2 niveaux : `/health` (essentiel
  Postgres+Redis), `/health/full` (tout).

## Commit final

Branche : `feat/phase-12-analytics-monitoring`.
Commit : `feat(observability): plausible, sentry, pino logs, healthchecks, uptime alerts`.
