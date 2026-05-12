# Post-mortem bascule V1 — template

À rédiger 7 jours après la bascule. Objectif : capitaliser, pas
juger. Lu par Paul + dev + reste de l'équipe.

> **À renommer** : `post-mortem-2026-MM-DD.md` ou similaire quand
> rempli pour de bon, et déplacer dans `docs/refonte/post-mortems/`.

---

## 1. Résumé exécutif

- **Date bascule** : 2026-MM-DD
- **Durée fenêtre de bascule** : T0 → T+24h
- **Décision rollback ?** : Oui / Non
- **Note globale** : (1-10)

## 2. Ce qui s'est bien passé

### Technique

- [Exemple] Migration des 247 customers en 14 min sans aucune erreur
- [Exemple] DNS propagé en 4 min, 100 % des résolveurs publics OK à T+15 min
- …

### Process

- [Exemple] Bêta privée a remonté 2 P0 corrigés à temps
- [Exemple] La checklist recette a évité un bug Stripe en pre-flight
- …

### Outils

- [Exemple] Sentry a immédiatement attrapé l'erreur sur ResetPassword
- [Exemple] Pino logs structurés ont permis le grep en 30 s
- …

## 3. Ce qui s'est mal passé

### Technique

- [Exemple] 3 anciennes URLs WP non couvertes par le mapper redirects
- [Exemple] Le webhook Stripe a retry 2x pour un transient timeout
- …

### Process

- [Exemple] La newsletter d'annonce J-7 n'a touché que 60 % de la base
- …

### Outils

- [Exemple] UptimeRobot pas configuré le bon ENDPOINT au début
- …

## 4. Décisions à inverser / conserver

| Décision V1                                 | Verdict   | Raison                             |
| ------------------------------------------- | --------- | ---------------------------------- |
| Option 2 abonnements (Lehena-native portal) | Conserver | UX cohérente, churn bas            |
| Modération avis 100 % manuelle              | Conserver | 0 spam reçu, charge équipe gérable |
| Pas de cookie banner V1                     | Conserver | Plausible cookieless suffisant     |
| Sentry sampling 10 %                        | Réviser   | Trop bas — passer à 20 %           |
| …                                           | …         | …                                  |

## 5. Backlog V1.1 priorisé

### P1 — corriger sous 30 jours

- [ ] [Exemple] Wishlist : bug sur variant_id null
- [ ] [Exemple] PDP : zoom mobile saccadé sur iPhone SE
- [ ] [Exemple] Email order-shipped : tracking number manquant
- …

### P2 — backlog 60-90 jours

- [ ] [Exemple] Dashboard widgets admin (Phase 10 reporté)
- [ ] [Exemple] Brevo sync customer (Phase 7 reporté)
- [ ] [Exemple] Workflow order-from-renewal subscription (Phase 11 reporté)
- [ ] [Exemple] Connexion sociale Google
- …

### P3 — backlog ouvert

- [ ] [Exemple] Programme fidélité
- [ ] [Exemple] Plugin Pilot AI
- [ ] [Exemple] Application mobile
- …

## 6. Métriques clés à J+7

| Métrique              | Avant bascule (7j) | Après bascule (7j) | Évolution |
| --------------------- | ------------------ | ------------------ | --------- |
| Sessions / jour       | X                  | Y                  | +/- %     |
| Taux conversion       | X %                | Y %                | +/- ppts  |
| Panier moyen          | X €                | Y €                | +/- %     |
| Trafic organique      | X                  | Y                  | +/- %     |
| Erreurs Sentry / jour | X                  | Y                  | +/-       |

## 7. Leçons apprises

3 leçons générales à capitaliser pour le prochain projet :

1. …
2. …
3. …

## 8. Remerciements

- Paul (porteur projet)
- Bêta-testeurs (#1 → #12)
- Inovesign (export migration)
- Atelier Lehena (recette responsive sur device perso)
- (Et toute personne ayant aidé)

---

**Rédigé par** : [Nom]
**Date** : 2026-MM-DD
**Status** : Final / Draft
