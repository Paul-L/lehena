# Bascule prod — index opérateur (Phase 14)

Point d'entrée de la phase de mise en ligne. Cette page **n'apparaît
qu'une fois** dans la vie du projet ; elle vous accompagne du freeze
code au post-mortem.

> ⚠️ Cette phase est presque entièrement opérationnelle. Le code
> applicatif est gelé à J-7. À partir d'ici, c'est de la coordination,
> des checklists, et de la surveillance.

---

## Calendrier J-21 → J+30

| Repère         | À faire                                      | Doc                                                 |
| -------------- | -------------------------------------------- | --------------------------------------------------- |
| **J-21**       | Recette fonctionnelle complète (checklist)   | [`recette-checklist.md`](./recette-checklist.md)    |
| **J-14**       | Recette responsive sur 6 devices             | [`recette-responsive.md`](./recette-responsive.md)  |
| **J-14 → J-7** | Bêta privée (8-12 testeurs)                  | [`beta-privee.md`](./beta-privee.md)                |
| **J-7**        | TTL DNS abaissé à 5 min · newsletter annonce | [`plan-bascule.md`](./plan-bascule.md) §1           |
| **J-2**        | Freeze code · rappel newsletter              | [`plan-bascule.md`](./plan-bascule.md) §2           |
| **J-1**        | Dry-run migration sur dump frais             | [`migration-runbook.md`](./migration-runbook.md) §1 |
| **J0**         | Bascule DNS · check propagation              | [`plan-bascule.md`](./plan-bascule.md) §3           |
| **J0 → J+7**   | Monitoring renforcé                          | [`monitoring-bascule.md`](./monitoring-bascule.md)  |
| **J+7**        | Post-mortem · backlog V1.1                   | [`post-mortem.md`](./post-mortem.md) (template)     |

---

## Si quelque chose casse

1. **Décision rollback ?** → [`plan-rollback.md`](./plan-rollback.md). Cible
   < 15 min pour ré-aiguiller le trafic vers l'ancien site.
2. **Erreur Sentry massive** → triage via [`observability.md`](./observability.md).
3. **Migration foireuse** → restore Postgres via [`deploy.md`](./deploy.md) §5.

---

## Communication

- **Liste interne** : Paul, atelier, copywriter, dev (= moi). Slack #lehena-refonte.
- **Clients** : newsletter J-7 + J-2 (cf. plan-bascule.md). Pas d'annonce J0
  pour éviter le rush au moment le plus fragile.
- **Presse / partenaires** : J+3 si tout va bien, J+7 sinon.

---

## Critères de succès (post-mortem)

À cocher dans le post-mortem :

- [ ] Bascule réalisée sans rollback
- [ ] Aucune commande perdue
- [ ] Conversion organique ≥ 60% du niveau ancien site sous 30 jours
- [ ] 0 incident P0 J0 → J+7
- [ ] ≤ 3 incidents P1 sur la même période
- [ ] Score Sentry stable (pas d'explosion en J+1)
