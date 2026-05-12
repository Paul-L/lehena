# Runbook — Google Business Profile (GBP)

Procédure opérateur pour l'optimisation et la maintenance de la fiche
Google Business Profile de Maison Lehena (Laguinge, vallée des Aldudes).

> ⚠️ **Prérequis** : être admin du compte GBP. Si la fiche est admin
> par un compte Google personnel (ancien webmaster, ancienne agence),
> demander un transfert vers le compte `gbp@lehena.fr` AVANT d'activer
> la nouvelle version du site.

---

## 1. État des lieux (J-0)

- [ ] Connexion à [business.google.com](https://business.google.com)
- [ ] Vérification : qui est admin actuel ? (Personnel ? Inovesign ?)
- [ ] Si admin personnel : ajouter `gbp@lehena.fr` comme owner, puis
      transférer l'ownership → l'ancien owner devient manager
- [ ] Vérification d'identité : ai-je accès à la boîte
      `gbp@lehena.fr` ?

## 2. Optimisation principale (J+1)

### Catégorie principale

**Boucherie-charcuterie** (catégorie historique). Catégories
secondaires :

- Producteur de viande
- Magasin de spiritueux (pour le patxaran)
- Épicerie fine
- Boutique en ligne

### NAP cohérent

À copier-coller EXACTEMENT (caractère pour caractère) entre :

- GBP
- Footer du site
- Schema `LocalBusiness` (cf. `src/lib/seo/schemas/local-business.ts`)
- Mentions légales

**Format de référence** :

```
Maison Lehena SAS
Bourg
64470 Laguinge
France
+33 5 59 00 00 00
contact@lehena.fr
```

### Horaires

- Lundi à vendredi : sur rendez-vous
- **Samedi : 9 h – 13 h** (boutique)
- Dimanche : fermé

Saisir dans GBP comme **horaires spéciaux** les fermetures (jours
fériés, congés d'été), pas dans les horaires standards.

### URL

- Site web : `https://lehena.fr`
- URL de prise de RDV (visites) : `https://lehena.fr/fr/atelier`

### Description courte (750 caractères max)

```
Maison Lehena est une charcuterie artisanale basque fondée en 1974,
située à Laguinge dans la vallée des Aldudes. Quatre générations
d'artisans, race basque Kintoa exclusive, affinage minimum 12 mois,
aucun nitrite — jamais. Boutique ouverte le samedi de 9 h à 13 h.
Visites guidées de l'atelier d'origine à partir de 2026.
```

### Attributs à activer

- Livraison locale ☑
- Livraison à l'échelle nationale ☑
- Retrait au magasin ☑ (samedi uniquement)
- Cartes de crédit ☑
- Apple Pay / Google Pay ☑ (post-Phase 5)
- Accessible aux personnes en fauteuil roulant : ☐ (à vérifier sur place)

## 3. Photos (J+2)

Minimum 20 photos, mises à jour mensuelles. Catégories :

- **Couverture** : 1 photo emblématique (mur cave + jambons)
- **Logo** : SVG du logo Lehena
- **Atelier** : 6-8 photos (cave d'affinage, salle de désossage,
  bureau Maïté, façade boutique)
- **Équipe** : 3-4 portraits (Maïté, Pantxo, apprentis)
- **Produits** : 6-8 packshots
- **Vie de la maison** : photos saisonnières (récolte céréales,
  marché Bayonne, expéditions Noël)

Tailles min : 720 × 720 px. Sourcing : `apps/storefront/public/`
ou shoot dédié.

## 4. Posts hebdomadaires (J+3, puis tous les lundis)

Format type "Quoi de neuf" — 100-300 mots, 1 photo, 1 CTA.

Idées de roulement :

- Lun S1 : portrait artisan
- Lun S2 : focus produit + lien PDP
- Lun S3 : actualité atelier (passage à l'affinage, nouvelle pièce)
- Lun S4 : article du journal SEO mis en avant

Outils : programmer 4 posts d'avance via le calendrier GBP (semaine
de prod du copywriter).

## 5. Demande d'avis (J+10 après livraison)

Le workflow technique est en place (Phase 9 — cron
`review-request-emails`). Le CTA dans l'email pointe vers
`/fr/account/orders/details/<id>` qui propose à terme un formulaire
d'avis interne (Phase 10) **et** un lien vers le profil GBP.

URL d'avis directe GBP (à récupérer depuis le dashboard, format
`https://g.page/r/<id>/review`) : à ajouter à
`STOREFRONT_URL/fr/account/orders/details/[id]` en V1 en CTA secondaire.

## 6. Suivi mensuel

- [ ] Connexion mensuelle, vérification :
  - [ ] Avis reçus → répondre TOUS (même les 5★, en 1-2 phrases)
  - [ ] Photos uploadées par des clients → laisser, ne pas supprimer
        sauf inapproprié
  - [ ] Insights : impressions, clics vers site, demandes itinéraire
  - [ ] Posts programmés pour les 4 semaines suivantes

## 7. Erreurs courantes à éviter

- ❌ NAP différent entre GBP et site → pénalité local SEO
- ❌ Ne pas répondre aux avis négatifs (toujours répondre, jamais
  agressif)
- ❌ Catégorie principale trop générique ("Magasin d'alimentation")
- ❌ Photos pourries / floues / qui datent
- ❌ Horaires non à jour (notamment fermetures jours fériés)
- ❌ Compte personnel comme admin unique (risque de perte d'accès)

## 8. À l'arrivée des visites guidées (2026)

- [ ] Activer le booking GBP (réservation directement depuis la
      fiche) si le système réservation interne est prêt
- [ ] Ajouter la catégorie "Atelier culinaire"
- [ ] Demander aux participants un avis sur GBP en fin de visite
