# Bêta privée — 1 semaine

8-12 testeurs, retour structuré, P0/P1 corrigés avant bascule.

---

## Sélection des testeurs

Mix recommandé (8-12 personnes total) :

- **4-5 clients fidèles** identifiés via l'historique de commandes
  (top spenders ou clients réguliers depuis ≥ 2 ans). Profil
  authentique mais bienveillant.
- **2-3 proches Lehena** (famille, amis de l'atelier) qui peuvent
  prendre 30 min sérieusement pour tester sans contrepartie.
- **1-2 testeurs externes** non-clients (recrutés via Pollfish ou
  Userbrain si budget). Regard neuf, pas biaisés affectivement.
- **1-2 pros e-commerce** (anciens collègues, consultants) pour les
  bugs UX qu'un non-tech ne voit pas.

**À éviter** :

- Les amis trop proches qui diront "c'est super" pour vous faire plaisir.
- Plus de 12 testeurs : on noie le signal dans le bruit.

## Brief envoyé aux testeurs

Email type (à adapter) :

> Bonjour [Prénom],
>
> Nous lançons la version refonte de lehena.fr et nous aimerions ton retour
> avant l'ouverture publique. Le site est disponible sur **https://staging.lehena.fr**
> du **[date] au [date]** (1 semaine).
>
> Ce qu'on te demande, idéalement en 30 min :
>
> 1. **Faire une vraie commande**. Tu peux payer avec ta carte (c'est en mode
>    test Stripe — aucun débit) ou avec un code promo `BETA100` qui te
>    rembourse intégralement.
> 2. **Naviguer sans contrainte** : explorer la boutique, lire les pages
>    histoire, créer un compte, mettre un produit en favoris, regarder
>    une recette.
> 3. **Tout noter** : ce qui te plaît, ce qui te ralentit, ce qui te paraît
>    bizarre, ce qui te bloque. Pas de filtre.
>
> Tu peux nous répondre par email ou remplir le formulaire
> **https://forms.lehena.fr/beta** (5-10 min).
>
> Merci infiniment — ton avis nous fait gagner des mois de
> trial-and-error une fois en prod.
>
> Maïté & Paul

## Modes de paiement bêta

Deux options selon préférence :

### Option A — Stripe test mode (recommandé)

- Le site staging tourne en mode test Stripe. Les cartes
  `4242 4242 4242 4242` (ou n'importe quelle vraie carte, mais le
  débit ne passera pas) permettent un parcours complet sans débit.
- Avantage : zéro paperasse, parfait pour tester le full flow.
- Inconvénient : les testeurs doivent savoir qu'ils peuvent saisir
  n'importe quelle carte sans débit (à expliquer dans le brief).

### Option B — Code promo 100 %

- Créer en staging un coupon `BETA100` à -100 %.
- Les testeurs payent symboliquement 0 €.
- Avantage : se rapproche d'un vrai checkout.
- Inconvénient : nécessite de désactiver le coupon avant bascule
  prod (sinon abus).

## Collecte des retours

Google Form ou Notion — un seul endroit. Champs minimum :

- Nom (facultatif)
- Device + OS + navigateur principal utilisés
- Note globale 1-10
- Choses appréciées (texte libre)
- Choses qui ont posé problème (texte libre)
- Bugs identifiés (texte + capture)
- Suggestions priorité 1
- Note "Recommanderiez-vous à un ami ?" 1-10 (NPS like)

## Triage

À J+5 de la bêta, ouvrir une session de tri avec Paul :

1. Tous les retours dans un même tableau (Notion / Sheets).
2. Tagger chaque retour : **P0** (bloque la bascule), **P1**
   (majeur, à fixer avant bascule), **P2** (backlog V1.1), **P3**
   (V2 — pertinent mais hors scope).
3. Pour les P0+P1 : assigner à dev (ou Paul), date cible
   antérieure à J-2 (freeze code final).
4. Communiquer à chaque testeur ce qui sera corrigé (transparence).

## Critères go / no-go bascule

- **Go** si : 0 P0 ouverts ET ≤ 3 P1 ouverts ET NPS moyen ≥ 7/10
- **No-go** sinon → décaler de 1-2 semaines, refaire un mini-cycle
  bêta sur les fixes appliqués.

## Remerciements

- Petit envoi à chaque bêta-testeur après bascule réussie : sachet
  saucisson + carte écrite à la main. Coût ~30 €/testeur, ROI
  relationnel énorme.
- Mention "Beta tester #1 → #12" sur la page /notre-histoire si ils
  acceptent (charte respect vie privée).
