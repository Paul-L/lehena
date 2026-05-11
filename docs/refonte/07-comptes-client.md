# Phase 6 — Comptes & espace client (auth, profile, wishlist, RGPD)

## Objectif de cette passe

Refondre l'inscription / login (email + password **et** magic link), construire
un espace client complet (commandes, adresses, profil, préférences, factures
PDF), ajouter une **wishlist** (module custom Medusa), et implémenter les
fonctions RGPD obligatoires (export données + suppression compte).

L'ancien Lehena.fr a une zone client WooCommerce standard, fonctionnelle mais
sans wishlist, sans re-order facile, sans export RGPD. On rectifie.

---

## PROMPT À COPIER-COLLER

```
On démarre la **Phase 6 — Comptes & espace client** de la refonte Lehena. Lis :

1. `docs/refonte/00-PLAN.md` (Phase 6 § 3)
2. `docs/refonte/strategie-seo.md` (§ 11→Phase 6) — l'espace client est `noindex`
3. RGPD : `https://www.cnil.fr/fr/rgpd-passer-a-laction` (notion clé : droit
   d'accès + droit à l'oubli)

Confirme avoir lu avant de commencer.

## Étape 1 — Reconnaissance

- Quel est l'état de l'auth actuelle côté storefront
  (`app/[countryCode]/(main)/account/`) ?
- Quelles routes / pages existent déjà : profile, addresses, orders, login,
  register, password-reset ?
- Comment le starter Medusa gère-t-il les sessions (JWT, cookies HTTP-only) ?
- Module Medusa Customer : est-il étendu / customisé ?
- Y a-t-il un module wishlist amorcé ?

## Étape 2 — Choix techniques à valider

a. **Auth** :
   - **Email + password** : standard Medusa.
   - **Magic link** : envoi d'un email avec un lien signé court (15 min),
     atterrit sur `/auth/callback?token=...`. Token = JWT signé serveur.
   - **Connexion sociale** (Google) : ouvrir le débat — utile mais ajoute
     une dépendance OAuth. Recommande oui/non pour V1.
   - **Politique mot de passe** : 10 caractères min, validateur côté serveur,
     pas de "complexité forcée" (anti-pattern NIST 2017).
   - **Sessions** : cookie HTTP-only `secure`, `SameSite=Lax`, durée 30 j.
   - **Reset password** : email avec lien signé 1h.

b. **Espace client — sections** :
   1. Dashboard : commandes récentes (3), CTA "Re-order" sur la dernière,
      total dépensé année courante, points fidélité (si implémenté en V1, sinon
      reporté V2).
   2. Commandes : liste paginée, détail commande (items, adresses,
      paiement, expédition avec tracking).
   3. Adresses : carnet d'adresses, défaut livraison + facturation.
   4. Profil : nom, prénom, téléphone, date de naissance (optionnel pour
      newsletter ciblée), préférences langue.
   5. Préférences newsletter : opt-in/out par catégorie de comm (transactionnel
      ne peut être désactivé, marketing oui, recettes oui).
   6. Wishlist : voir section (e).
   7. Mes factures : liste + download PDF (PDF généré à la commande, stocké
      sur S3, signed URL pour download).
   8. RGPD : "Exporter mes données" + "Supprimer mon compte".

c. **Re-order** :
   - Bouton "Recommander" sur chaque ligne d'historique : ajoute tous les
     items au panier, signale les indisponibilités, redirige vers le panier.

d. **Factures PDF** :
   - Génération à `order.captured` via workflow Medusa.
   - Template HTML → PDF (Puppeteer ou `@react-pdf/renderer` ?). Recommande
     selon poids dépendances et qualité rendu.
   - Stockage S3 (chiffré au repos via Scaleway).
   - Download via signed URL valide 15 min.
   - Numérotation séquentielle annuelle (mention légale fr).

e. **Wishlist** :
   - Nouveau module Medusa `wishlist` : entité `wishlist_item` (customer_id,
     product_id, variant_id nullable, created_at).
   - Pas de "liste" nommée en V1 (1 customer = 1 wishlist implicite).
   - API store : `GET /store/wishlist`, `POST /store/wishlist/items`,
     `DELETE /store/wishlist/items/:id`.
   - Côté storefront : cœur sur PDP et card, état persistant via SWR.
   - Pour invités : localStorage, migré au login.

f. **RGPD** :
   - **Export données** : route `GET /store/customers/me/export` qui retourne
     un JSON contenant : profile, adresses, commandes (sans données carte
     Stripe — c'est leur juridiction), wishlist, abonnements newsletter,
     historique communications. Throttle 1/jour.
   - **Suppression compte** :
     - Étape 1 : confirmation par mot de passe.
     - Étape 2 : email de validation envoyé.
     - Étape 3 : sur clic du lien, **anonymisation** (pas de hard delete car
       on garde les commandes pour comptabilité légale 10 ans) :
       email → `deleted-<id>@lehena.fr`, nom → "Client supprimé", adresses
       hard-deleted, wishlist hard-deleted, newsletter unsubscribed.
   - Journal RGPD : table `gdpr_log` (customer_id, action, requested_at,
     completed_at, ip).

g. **Espace client SEO** : toutes les routes sous `/account/*` en `noindex,
   nofollow` (X-Robots-Tag + meta).

## Étape 3 — Plan détaillé

5-7 sous-passes :

- A : Auth (password + magic link + reset).
- B : Layout espace client + dashboard + nav.
- C : Pages commandes (liste + détail) + re-order.
- D : Pages adresses + profil + préférences.
- E : Module wishlist (backend + storefront).
- F : Factures PDF (génération + storage + download).
- G : RGPD (export + suppression).

## Étape 4 — Implémentation

- Branche `feat/phase-6-comptes-client`.
- Server Components partout sauf interactivité.
- Validation zod sur toutes les routes API + côté form.
- Toasts d'erreur clairs et localisés.
- Tests : un test par route API critique (login, register, reset, wishlist,
  rgpd export, rgpd delete).

## Contraintes (rappel)

- TypeScript strict.
- Pas d'écriture en clair de password.
- Tokens magic link signés (JWT court).
- Routes account toutes en `noindex`.
- Workflows Medusa pour toute mutation customer.

## Ce que tu NE fais PAS

- Programme de fidélité (V2).
- Connexion sociale (à arbitrer en étape 2, mais on report en V2 par défaut).
- Subscriptions (Phase 11).
- Envoi d'email réel (Phase 7, ici on stub).

Vas-y, commence par l'étape 1.
```

---

## Ce que tu dois valider à la fin de cette passe

- [ ] Création de compte : email + password fonctionne, email "bienvenue"
      logué.
- [ ] Magic link : depuis login alternatif, je reçois un lien (en log)
      qui me connecte sans password.
- [ ] Reset password : flow complet end-to-end avec token signé court.
- [ ] Dashboard espace client affiche commandes récentes + CTA re-order.
- [ ] Re-order ajoute les items au panier, gère les indispos.
- [ ] Wishlist : ajouter / retirer un produit depuis PDP, persiste après refresh.
- [ ] Wishlist invité : ajouter en non connecté, login, items conservés.
- [ ] Facture PDF : sur une commande captured, le PDF est généré et téléchargeable.
- [ ] Export RGPD : retourne un JSON cohérent.
- [ ] Suppression compte : anonymise correctement, conserve les commandes
      pour la comptabilité.
- [ ] Toutes les routes `/account/*` en `noindex`.

## Pièges courants

- **Magic link** : signer avec un secret rotatif. Ne PAS stocker le token en DB
  (stateless JWT court).
- **Sessions** : `SameSite=Lax` ok pour login, mais `Strict` casse les
  redirections post-paiement.
- **PDF Puppeteer** : lourd en RAM, préférer `@react-pdf/renderer` pour des
  factures simples.
- **Anonymisation RGPD** : ne PAS hard-delete les commandes (obligation
  comptable 10 ans en France).
- **Localstorage wishlist invité** : limiter taille (max 50 items) sinon
  abus.

## Commit final

Branche : `feat/phase-6-comptes-client`.
Commit : `feat(account): auth (password + magic link), dashboard, wishlist, invoices, gdpr`.
