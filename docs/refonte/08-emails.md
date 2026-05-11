# Phase 7 — Emails transactionnels + sync marketing (Resend + Brevo)

## Objectif de cette passe

Brancher Resend en tant que notification provider Medusa, créer les templates
React Email brandés Lehena pour toutes les communications transactionnelles
(confirmation, expédition, livraison, abandon panier, reset password, magic
link, facture, retour), synchroniser les contacts vers Brevo pour les
campagnes marketing.

L'ancien site a une newsletter avec **Lorem ipsum visible** (cf. audit § 7),
donc on remet à plat avec une vraie expérience email cohérente avec le design
Lehena.

---

## PROMPT À COPIER-COLLER

```
On démarre la **Phase 7 — Emails** de la refonte Lehena. Lis :

1. `docs/refonte/00-PLAN.md` (Phase 7 § 3)
2. `docs/refonte/audit-site-actuel.md` (mention Lorem ipsum newsletter)
3. `docs/refonte/strategie-seo.md` (§ 11→Phase 7)
4. Doc React Email : https://react.email/docs

Confirme avoir lu.

## Étape 1 — Reconnaissance

- Y a-t-il déjà un notification provider configuré dans `medusa-config.ts` ?
- Où sont logués actuellement les emails stub (Phase 5 et Phase 6) ?
- Existe-t-il un module ou helper email côté backend ?

## Étape 2 — Choix techniques à valider

a. **Provider Resend** :
   - Module Medusa : aucun officiel à ma connaissance. Implémenter en
     **notification provider custom** dans `apps/backend/src/modules/notification-resend/`.
     - Méthode `send(notification)` qui mappe `notification.template` → React
       Email component → render HTML → appel Resend SDK.
   - Configurer dans `medusa-config.ts` comme provider de notifications.
   - Webhook Resend (bounces, complaints, opens, clicks) : route admin
     `/admin/webhooks/resend` qui logue + tague le contact.

b. **Templates React Email** :
   Localiser dans `apps/backend/src/notifications/emails/`.
   Composants partagés : `<EmailLayout>` (header logo + footer + couleurs
   Lehena), `<Button>`, `<ProductCard>`, `<OrderSummary>`.

   Templates à produire :
   1. `welcome.tsx` — bienvenue après inscription.
   2. `password-reset.tsx` — reset password avec lien.
   3. `magic-link.tsx` — login passwordless.
   4. `order-confirmation.tsx` — récap commande, items, total, livraison
      estimée, lien suivi.
   5. `order-shipped.tsx` — expédition, numéro de suivi Chronofresh /
      Colissimo, lien tracking.
   6. `order-delivered.tsx` — livré, demande d'avis (J+7).
   7. `abandoned-cart.tsx` — abandon panier J+1 et J+3 (workflow planifié).
   8. `invoice.tsx` — facture jointe en PDF, message court.
   9. `contact-form.tsx` — message du formulaire contact à
      `contact@lehena.fr`.
   10. `newsletter-double-opt-in.tsx` — confirmation d'inscription.
   11. `account-deletion-confirmation.tsx` — lien de confirmation RGPD.

   Chaque template :
   - Localisé (FR par défaut, ES et EN en stub pour Phase 4).
   - Preview text < 90 caractères.
   - Adresse de désinscription présente pour les emails marketing
     (transactionnels exemptés).
   - Bouton CTA principal unique (anti-spam).

c. **Subscribers Medusa** :
   - `subscribers/customer-created.ts` → welcome.
   - `subscribers/order-placed.ts` → order-confirmation.
   - `subscribers/order-shipped.ts` → order-shipped.
   - `subscribers/order-delivered.ts` → order-delivered.
   - Cron `subscribers/abandoned-cart-cron.ts` (run J+1 et J+3 quotidien)
     → abandoned-cart.

d. **Sync Brevo (marketing)** :
   - Module custom `notification-brevo` ou intégrer dans le module `marketing`
     dédié ?
   - Sync au customer create / update : push contact dans liste Brevo.
   - Segments à créer en V1 : "Tous", "Acheteurs frais", "Acheteurs épicerie",
     "VIP > 200 € cumul", "Inactifs > 6 mois".
   - Double opt-in via Resend (envoi du lien de confirmation), inscription
     à la liste Brevo seulement après confirmation.
   - **Pas** d'envoi marketing depuis Resend — Resend = transactionnel uniquement.

e. **Page de gestion des préférences** :
   - `/preferences?token=...` : lien dans tous les emails permettant de
     désinscrire sans login.
   - Page liste les types de comm (transactionnel verrouillé, marketing,
     recettes, ventes flash) avec toggle.

f. **Anti-abus** :
   - Throttle d'envoi par customer (max 5 emails marketing / semaine).
   - DKIM / SPF / DMARC configurés sur lehena.fr (dépend de l'agence email
     et du DNS).

## Étape 3 — Plan détaillé

5-7 sous-passes :

- A : Provider Resend custom + webhook bounce/complaint.
- B : Templates React Email (layout commun + 11 templates).
- C : Subscribers Medusa + cron abandoned-cart.
- D : Sync Brevo + double opt-in.
- E : Page préférences + désinscription.
- F : Configuration DNS (DKIM / SPF / DMARC) — fichier `docs/refonte/dns-emails.md`
  qui décrit les enregistrements à poser.

## Étape 4 — Implémentation

- Branche `feat/phase-7-emails`.
- Tous les emails passent par Resend en mode "preview" (`RESEND_DEV_MODE=true`)
  qui les envoie à une adresse fixe `paul+dev@lehena.fr`. Désactiver en prod.
- Test visuel : générer chaque template en HTML statique et le tester sur
  Litmus / Email on Acid si possible, sinon `react-email preview` local.

## Contraintes (rappel)

- Pas de variable client (`process.env.NEXT_PUBLIC_*`) côté backend pour les
  secrets Resend / Brevo.
- Logs structurés : un log par email envoyé avec `template`, `customer_id`,
  `resend_id`.
- Idempotence : si un webhook order-placed se répète, on ne renvoie pas
  l'email 2x (table `email_sent_log`).
- Pas de Lorem ipsum, jamais. Le contenu placeholder explicite est marqué
  `[À RÉDIGER]`.

## Ce que tu NE fais PAS

- Pas de templates SMS / push (V2).
- Pas de A/B testing de templates (V2).
- Pas de tracking pixel Brevo (RGPD : à arbitrer en Phase 12).

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Une commande test déclenche bien `order-confirmation` envoyé via Resend
      (vérifier dans le dashboard Resend).
- [ ] Reset password : email reçu, lien signé fonctionne.
- [ ] Magic link : idem.
- [ ] Abandoned cart J+1 et J+3 envoyés sur un panier test laissé.
- [ ] Sync Brevo : un nouveau customer apparaît dans la liste après double
      opt-in.
- [ ] Page `/preferences` permet de toggle les comms.
- [ ] Tous les templates rendus correctement sur Gmail, Outlook web, Apple
      Mail (dark mode inclus).
- [ ] DKIM / SPF / DMARC documentés dans `docs/refonte/dns-emails.md`.
- [ ] Aucun "Lorem ipsum" ni "TODO" dans les emails produits.

## Pièges courants

- **Deliverability initiale** : Resend a un score correct mais sans warm-up
  les premiers envois en masse peuvent finir en spam. Commencer petit.
- **Reset password lien signé** : ne pas re-vérifier le hash du password
  côté serveur lors du reset — laisser le user en choisir un nouveau sans
  contraindre.
- **React Email + Tailwind** : la lib supporte Tailwind mais les clients
  email avalent peu de CSS. Préférer styles inline ou la version "build-time"
  de React Email.
- **Brevo opt-in** : sans double opt-in, risque RGPD + risque blacklist FAI.

## Commit final

Branche : `feat/phase-7-emails`.
Commit : `feat(emails): resend provider + react email templates + brevo sync + preferences`.
