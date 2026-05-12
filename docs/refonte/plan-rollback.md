# Plan de rollback

À exécuter si la bascule prod échoue. Cible : < 15 minutes pour
ré-aiguiller le trafic vers l'ancien site.

---

## Quand déclencher

Critères CUMULATIFS de rollback :

- ≥ 3 erreurs Sentry P0 en 30 min sur du trafic réel
- /health backend ou storefront down > 5 min
- Stripe webhooks en erreur > 3 retries
- Ou : décision Paul "stop, on rollback"

Critères **non-rollback** (à corriger en hot-fix sans toucher au DNS) :

- Une PDP cassée → la corriger / la cacher via le CMS
- Un email transactionnel qui plante → retry manuel
- Une erreur unique sur Sentry → triager normalement

## Procédure (15 min cible)

### T0 — Décision

- [ ] Paul valide explicitement le rollback sur Slack interne.
- [ ] Annoncer sur Slack "🚨 ROLLBACK ENGAGED" pour figer toute autre
      action.

### T+1 min — DNS

- [ ] Retour à l'ancienne config DNS :
  - `lehena.fr` `A` → ancienne IP WordPress
  - `www.lehena.fr` `CNAME` → ancien (idem)
- [ ] Le TTL est à 5 min (configuré J-7), donc propagation rapide.

### T+5 min — Vérification

- [ ] `dig lehena.fr` retourne l'ancienne IP
- [ ] Ouvrir https://lehena.fr en navigation privée → ancien site charge

### T+10 min — Communication

- [ ] Message clients (newsletter + Insta/Facebook) :
  > Nous avons rencontré un imprévu technique. Le site est de nouveau
  > opérationnel sur sa version précédente. Nous reviendrons rapidement
  > avec un nouveau créneau de bascule. Merci de votre patience.
- [ ] Pas de détails techniques publics — protège l'image de marque.

### T+15 min — Stripe / Resend

- [ ] **Stripe** : continuer à observer les webhooks. Les commandes
      déjà passées en prod nouvelle version sont valides (rien à annuler),
      mais aucune nouvelle commande n'entrera tant qu'on n'a pas re-basculé.
- [ ] **Resend** : aucun email pending — la bascule DNS coupe l'origine
      des emails programmés.

## Que se passe-t-il pour les commandes déjà entrées ?

Toute commande captured entre la bascule T0 et le rollback :

- [ ] Reste dans Medusa prod (Railway), invisible publiquement.
- [ ] Exporter via /admin/exports/orders sur le créneau exact.
- [ ] Saisir manuellement dans l'ancien WooCommerce ou traiter
      off-platform.
- [ ] Communiquer individuellement à chaque client : "Votre commande
      est en cours de traitement, vous recevrez votre confirmation
      prochainement."

## Post-rollback

1. **Préserver les preuves** : ne PAS supprimer le déploiement prod en
   erreur. Garder pour le post-mortem.
2. **Snapshot Postgres** : `pg_dump` la base prod nouvelle version
   immédiatement (capture l'état au moment du rollback).
3. **Sentry** : annoter chaque issue avec "Pre-rollback bascule J0
   2026-MM-DD" pour la post-mortem.
4. **Post-mortem incident** dans `docs/refonte/incidents/` (séparé
   du post-mortem général V1).
5. **Nouveau créneau** : reprogrammer la bascule au mieux à J+7 (après
   correction du root cause + nouvelle bêta privée sur les zones
   modifiées).

## Anti-patterns à éviter

- ❌ Vouloir "réparer à chaud" en prod plutôt que rollback. Si plus
  de 30 min de tâtonnement, on rollback. Sans état d'âme.
- ❌ Communiquer techniquement aux clients ("erreur 502 sur le
  backend Medusa"). Reste simple et rassurant.
- ❌ Annuler les commandes Stripe pendant le rollback. Elles sont
  valides, traitées off-platform, et créditer le client pose des
  questions comptables.
- ❌ Modifier le DNS pour pointer vers le staging. Mauvais TTL,
  pas en mode prod, pas safe.

## Avant de re-bascule

Avant un 2ème essai de bascule :

- [ ] Root cause documenté
- [ ] Fix appliqué + tests E2E vert sur staging
- [ ] Mini-bêta privée 48 h sur le périmètre du fix
- [ ] Plan de bascule adapté si nécessaire
- [ ] Nouveau créneau annoncé au moins 48 h à l'avance
