# Plan de bascule — jour-J

Procédure heure par heure pour basculer prod en minimisant le risque.

> ⚠️ Lire intégralement la veille. Tous les acteurs (Paul, dev, atelier
> si dispo) calent un créneau de 4 h le jour J.

---

## §1. T-7j (J-7)

### DNS

- [ ] Baisser le TTL des records DNS à **5 minutes** sur lehena.fr :
  - `lehena.fr` (A / CNAME)
  - `www.lehena.fr`
  - `api.lehena.fr` (si déjà en place)
  - `mail.lehena.fr` (Resend)
- [ ] Vérifier propagation via `dig +trace lehena.fr` ou
      https://dnschecker.org/

### Communication

- [ ] Envoyer la **newsletter d'annonce** :
  > Bonjour, nous modernisons lehena.fr — le site sera indisponible
  > entre **[date] [heure]** et **[date] [heure]**. À très vite sur
  > la nouvelle version.
- [ ] Publier sur Instagram + Facebook Lehena le même message.
- [ ] Préparer la page de maintenance simple à servir depuis l'ancien
      hébergement durant la fenêtre de bascule.

### Provisioning

- [ ] Vérifier que Vercel + Railway + Scaleway + Resend + Sentry +
      Plausible sont **tous** opérationnels en prod (pas seulement staging).
- [ ] Tous les secrets en place (cf. `secrets-rotation.md` §1).
- [ ] Stripe en mode **live** (clés `sk_live_…`), webhook prod
      configuré.

## §2. T-48h (J-2)

### Freeze code

- [ ] Tag `release-candidate-vX.Y.Z` sur `develop`.
- [ ] **Pas de merge** sur `develop` jusqu'à la bascule sauf P0
      bloquant validé par Paul.
- [ ] PR sur `main` ouverte (mais pas mergée).

### Communication

- [ ] **Rappel newsletter** : "Demain matin, nous basculons sur la
      nouvelle version. Le site sera indisponible entre X et Y."
- [ ] Email interne aux équipes atelier : les commandes captives entre
      X et Y seront traitées dès la reprise.

### Dry-run migration finale

- [ ] Dump frais de l'ancienne prod (ou export WC API live).
- [ ] Run sur env temporaire staging :
  ```sh
  pnpm medusa exec ./src/scripts/migrate-products.ts -- --source=api
  pnpm medusa exec ./src/scripts/migrate-customers.ts -- --source=api
  pnpm medusa exec ./src/scripts/migrate-media.ts -- --source=api
  pnpm medusa exec ./src/scripts/build-redirects.ts -- --source=api
  ```
- [ ] Vérifier les rapports JSON. 0 failed.
- [ ] Tester 20 anciennes URLs → 301 OK.

## §3. T-2h (J0 matin)

- [ ] PR `develop` → `main` mergée. CI verte sur main.
- [ ] Railway prod déploie automatiquement (avec approval).
- [ ] Vercel prod déploie automatiquement.
- [ ] Vérifier `/health` backend + storefront sur les **URLs Vercel/Railway**
      directes (pas encore via DNS lehena.fr).

## §4. T-1h (J0)

- [ ] Snapshot Postgres prod manuellement :
  ```sh
  railway run pg_dump $DATABASE_URL > backups/pre-bascule-$(date +%F-%H%M).sql
  ```
- [ ] Mettre l'ancien lehena.fr en **mode lecture seule** (HTML statique
      servi via maintenance page) — coordonné avec Inovesign.
- [ ] Exécuter la migration finale **delta** (ce qui a bougé depuis le
      dry-run J-2) :
  ```sh
  pnpm medusa exec ./src/scripts/migrate-customers.ts -- --source=api --commit
  pnpm medusa exec ./src/scripts/build-redirects.ts -- --source=api --commit
  ```
- [ ] Lancer **sanity check** :
  - Backend `/health` 200
  - Storefront `/api/health` 200
  - `/sitemap.xml` retourne 200
  - `/fr` 200
  - Random PDP 200
  - Stripe webhook health (envoyer un test event via dashboard)

## §5. T0 — Bascule DNS

- [ ] Modifier les records DNS chez le registrar :
  - `lehena.fr` `A` → IP Vercel (ou `CNAME` selon config Vercel)
  - `www.lehena.fr` `CNAME` → `lehena.fr`
  - `api.lehena.fr` `CNAME` → Railway backend domain
- [ ] Lancer un timer "T0+15 min".

## §6. T+15 min

- [ ] Vérifier propagation DNS :
  ```sh
  dig +trace lehena.fr
  dig +trace api.lehena.fr
  ```
- [ ] Tester depuis 3 connexions différentes (4G mobile, fibre maison,
      un VPN US si possible).
- [ ] Vérifier qu'aucune ressource ne 404 sur la home et 5 PDP random.

## §7. T+1h

- [ ] Tour de plateformes :
  - **Plausible** : reçoit-il du trafic ?
  - **Sentry** : aucune erreur in-flight ?
  - **UptimeRobot/Better Stack** : monitor passé sur la nouvelle URL ?
  - **Search Console** : sitemap soumis et accepté ?
- [ ] Test commande réelle :
  - 1 produit ambient en CB Stripe (carte perso ou test)
  - 1 produit fresh en CB Stripe
  - Vérifier order placée + email reçu + facture PDF générée
- [ ] Si tout est vert : annoncer la bascule sur Slack interne + Insta/Facebook.

## §8. T+24h

- [ ] Revue trafic via Plausible
- [ ] Sentry : tout erreur ouverte triagée, P0/P1 dispatché
- [ ] Search Console "Couverture" : 0 erreur 4xx
- [ ] Revue logs Pino : aucun pic anormal

## §9. T+7j

- [ ] Search Console détaillée : positions critiques (best-sellers +
      pillar pages)
- [ ] Plausible : conversion organique vs J-7 (cible ≥ 60% niveau
      ancien site)
- [ ] Tickets P0/P1 ouverts → fermés ou explicitement reportés
- [ ] Rédaction du post-mortem (cf. `post-mortem.md` template)

## §10. Critères de réussite

À la fin de la fenêtre T0+24h :

- [ ] DNS propagé partout (≥ 95% des résolveurs publics)
- [ ] /health stable 200 sur 24h consécutives
- [ ] ≥ 1 commande réelle réussie en CB
- [ ] 0 erreur Sentry critique
- [ ] Plausible reçoit > 100 sessions
- [ ] Search Console accepte la propriété + sitemap

Si **3 ou plus** critères KO : envisager rollback (cf.
`plan-rollback.md`).
