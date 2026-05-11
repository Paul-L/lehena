# Phase 11 — Abonnements (optionnelle)

## Objectif de cette passe

**Phase optionnelle**, à arbitrer en milieu de projet selon avance et appétit
revenu récurrent. Ajoute la possibilité pour les clients de souscrire à un
**abonnement** (typiquement "box mensuelle Pays Basque" 49-79 €/mois) avec
paiement récurrent Stripe, gestion fine côté espace client (pause, skip,
annulation), et workflows backend (création commande automatique chaque
échéance).

Si on coupe cette phase pour tenir les délais, **aucun impact** sur les
autres phases ni sur la bascule.

---

## PROMPT À COPIER-COLLER

```
On démarre la **Phase 11 — Abonnements** de la refonte Lehena. C'est une
phase optionnelle, confirme avec moi qu'elle est bien dans le scope avant
de coder.

Lis :

1. `docs/refonte/00-PLAN.md` (Phase 11 § 3) — explicitement marquée optionnelle
2. Doc Stripe Subscriptions : https://stripe.com/docs/billing/subscriptions/overview
3. Doc Stripe Customer Portal (alternative pour gérer l'abo côté client)

Si je confirme, continue. Sinon, on saute.

## Étape 1 — Reconnaissance

- État du provider Stripe (Phase 5) : couvre-t-il les paiements récurrents ?
- Module Customer / Order Medusa : compatible avec des "commandes récurrentes" ?
- Y a-t-il un module subscription officiel Medusa v2 ? Cherche dans
  `@medusajs/*` packages et plugins communautaires.

## Étape 2 — Choix techniques à valider

a. **Périmètre V1 abonnement** :
   - 2-3 box types maximum : "Découverte" (3 produits, 49 €), "Gourmet"
     (5 produits, 79 €), "Patxaran amateur" (2 bouteilles, 35 €). Confirme.
   - Fréquence : mensuelle uniquement en V1. Pas de bimensuel ou trimestriel.
   - Pas de personnalisation du contenu de la box V1 (atelier choisit le
     contenu mensuel).
   - Pas de remise spécifique abonné V1 (simplifie la facturation).

b. **Stack technique** :
   - Option 1 : utiliser **Stripe Subscriptions** + Customer Portal Stripe
     pour la gestion (pause, annulation, mise à jour CB). Simple à
     implémenter, mais le client quitte le site Lehena pour le portail Stripe.
   - Option 2 : implémenter un module Medusa custom `subscription` qui pilote
     via l'API Stripe et expose un espace client natif Lehena.
   - Recommande Option 2 si on veut une UX cohérente, Option 1 si on veut
     livrer en 3-4 jours max.

c. **Modèle de données (Option 2)** :
   - Entité `subscription` : id, customer_id, plan_id, status
     (`active`|`paused`|`cancelled`), stripe_subscription_id,
     current_period_start, current_period_end, next_charge_at, address_id,
     gift_message, created_at, updated_at.
   - Entité `subscription_plan` : id, name, slug, price, frequency_days,
     box_size, description, hero_image.
   - Workflow `create_subscription` : crée le customer Stripe si besoin,
     crée la subscription Stripe, persiste en DB.
   - Webhook Stripe `invoice.paid` → workflow `process_subscription_renewal`
     → crée une commande Medusa pour cette échéance, déclenche les emails
     et l'expédition.

d. **Espace client** :
   - `/account/subscriptions` : liste de mes abonnements, statut, prochaine
     échéance.
   - Actions : pause (skip prochain envoi), reprise, annulation (effet fin
     de période en cours).
   - Modifier la CB : passage par Stripe Customer Portal ou modal in-house ?
     Recommande pour la sécurité.

e. **Tunnel d'abonnement** :
   - Page `/abonnements` qui présente les 2-3 plans.
   - Tunnel dédié 3 étapes : choix plan → adresse + paiement (CB only,
     pas Alma pour le récurrent) → confirmation.

f. **Emails** :
   - Welcome abonnement (différent du welcome compte).
   - Notification "Votre box arrive bientôt" J-3.
   - Notification "Votre box est expédiée".
   - Email échec de paiement (3 tentatives Stripe avant pause auto).

g. **Comptabilité** :
   - Chaque échéance génère une commande + une facture PDF (Phase 6 system
     réutilisé).

## Étape 3 — Plan détaillé

5-7 sous-passes :

- A : Module subscription (backend) + workflows création / renouvellement /
  pause / cancel.
- B : Provider Stripe Subscriptions branché.
- C : Page `/abonnements` (vitrine) + tunnel.
- D : Espace client subscriptions.
- E : Emails dédiés.
- F : Tests E2E manuels documentés.

## Étape 4 — Implémentation

- Branche `feat/phase-11-abonnements`.
- Mode test Stripe avec subscriptions test.
- Tester explicitement : 1 cycle complet (création → renouvellement automatique
  via clock skip Stripe → expédition) en mode test.

## Contraintes (rappel)

- Webhooks Stripe **idempotents** (un webhook reçu 2x ne crée pas 2 commandes).
- Pas de billing en clair : Stripe pilote.
- RGPD : suppression compte → annule abonnement actif + Stripe.

## Ce que tu NE fais PAS

- Pas de personnalisation contenu box (V2).
- Pas de programme parrainage (V2).
- Pas de cadeau abonnement (offrir une box à quelqu'un — V2).

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Je peux souscrire à un abonnement test Stripe, payer la première
      échéance, recevoir l'email confirmation.
- [ ] Une seconde échéance générée via clock skip Stripe crée une nouvelle
      commande automatique.
- [ ] Je peux mettre en pause depuis l'espace client, prochain renouvellement
      annulé.
- [ ] Je peux annuler, abonnement passe en `cancelled`, prochain renouv
      n'a pas lieu.
- [ ] Échec de paiement Stripe (carte test `4000000000000341`) déclenche
      l'email d'échec et passe l'abo en pause après 3 retries Stripe.
- [ ] Une facture PDF est générée par échéance et téléchargeable.

## Pièges courants

- **Webhook Stripe idempotence** : indispensable, sinon doublons.
- **Stripe clock test** : utile pour tester les renouvellements en
  accéléré. À documenter dans le README backend.
- **Timezone** : `next_charge_at` doit être en UTC, traduit en affichage local.
- **RGPD suppression** : ne pas oublier de cancel l'abo Stripe sinon le client
  continuera d'être facturé.

## Commit final

Branche : `feat/phase-11-abonnements`.
Commit : `feat(subscriptions): plans, stripe subscriptions, account portal, emails`.
