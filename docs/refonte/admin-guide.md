# Guide admin — équipe Lehena

Procédure quotidienne pour l'équipe Lehena qui pilote la boutique depuis
l'admin Medusa (URL : `https://admin.lehena.fr`).

> Mise à jour : Phase 10 — Reviews, recettes, exports CSV, alertes
> automatisées par email.

---

## 1. Modérer les avis client

### Pourquoi

Tous les nouveaux avis arrivent en `pending` (politique V1 : modération
manuelle 100 %). Tant qu'ils ne sont pas approuvés, ils n'apparaissent
pas sur la PDP.

### Procédure

1. Aller dans **Reviews** (sidebar admin).
2. Filtre par défaut : `status = pending`. La liste descend par date.
3. Pour chaque avis :
   - Lire le corps.
   - Vérifier que le client a bien commandé le produit (le système le
     fait déjà au moment de la soumission — c'est une double vérif).
   - **Approuver** → l'avis s'affiche sur la PDP, le `approved_by`
     enregistre votre identifiant admin.
   - **Rejeter** → l'avis disparaît de la liste publique. Le client n'est
     pas notifié (politique V1).
   - **Supprimer** uniquement pour spam manifeste.
4. Cadence cible : 1 passage / jour (matin).

### Quand cesser d'approuver

- Insultes, contenu illégal, spam → **Rejeter**.
- Avis légitime mais reportant un problème opérationnel (colis abîmé,
  retard) → **Approuver** + traiter via email (le client n'est notifié
  ni dans un cas ni dans l'autre).
- Avis 5★ générique d'un client connu (proche de l'équipe) →
  **Approuver** sans hésiter.

## 2. Exporter les commandes en CSV (comptabilité)

### Pourquoi

L'expert-comptable a besoin du mois précédent au format Excel FR (`;`
séparateur, `,` décimal) à la fin de chaque mois.

### Procédure

1. Aller dans **Exports → Orders** (à câbler côté admin UI ; en
   attendant, appel direct via Insomnia/curl).
2. Choisir :
   - `from` : `2026-04-01`
   - `to` : `2026-05-01`
   - `status` : `[completed]` (laisser vide pour tout récupérer)
3. Clique **Télécharger**. Le CSV se télécharge directement (pas de
   S3 round-trip en V1).
4. Ouvrir dans Excel FR — tout doit s'aligner correctement.

### Curl équivalent

```sh
curl -X POST https://admin.lehena.fr/admin/exports/orders \
  -H "Content-Type: application/json" \
  --cookie "$ADMIN_COOKIE" \
  -d '{"from":"2026-04-01","to":"2026-05-01","status":["completed"]}' \
  -o "lehena-orders-2026-04.csv"
```

## 3. Créer une recette

### Pourquoi

Les pages recettes (type=recipe) ont leur propre route SEO
`/fr/recettes/<slug>` avec schema `Recipe` injecté (Google Rich Results).

### Procédure

1. **Pages → New page** dans l'admin.
2. Choisir `type: recipe` (champ Phase 9).
3. Slug : `tartine-jambon-orhi-figue` par exemple.
4. Titre, excerpt, meta_title (≤ 70), meta_description (≤ 160).
5. Image OG : 1200 × 630 px, recommandé.
6. Contenu TipTap : utiliser les nodes custom (Phase 4) pour photos +
   product-embed (drive vers les PDP).
7. **Champs Recipe structurés** (V1, à mettre dans `metadata.recipe`
   du JSON page — bouton "Métadonnées avancées" dans l'admin) :
   ```json
   {
     "recipe": {
       "prep_time": "PT15M",
       "cook_time": "PT0M",
       "total_time": "PT15M",
       "recipe_yield": "4 personnes",
       "recipe_category": "Apéritif",
       "ingredients": [
         "4 tranches de pain de campagne",
         "100 g de Jambon Orhi 18 mois",
         "2 figues fraîches",
         "1 cs de miel d'acacia"
       ],
       "steps": [
         "Toaster légèrement le pain.",
         "Tartiner d'une fine couche de miel.",
         "Disposer les tranches de jambon, puis les figues coupées en quartiers.",
         "Servir tiède."
       ]
     }
   }
   ```
8. Publier. Vérifier sur `https://lehena.fr/fr/recettes/<slug>`.
9. Tester le rich result :
   [validator.schema.org](https://validator.schema.org/) +
   [search.google.com/test/rich-results](https://search.google.com/test/rich-results).

## 4. Lire les alertes stock + DDM (email matinal)

### Stock bas (cron daily 07:00)

Email automatique à `atelier@lehena.fr` (ou `STOCK_ALERTS_TO` si
configuré) listant chaque variante avec stock < 5 unités. Trier par
priorité.

### DDM courte (cron daily 07:30)

Idem mais pour les produits dont la DDM est sous 30 jours (configurable
via `DDM_SHORT_THRESHOLD`). Penser à les valoriser : promotion, mise
en avant home, coffret dégustation.

### Actions à prendre

- Stock bas : recharger en priorité ou désactiver `manage_inventory`
  sur la variante pour éviter l'épuisement annoncé en boutique.
- DDM courte : marquer en promo ou retirer du catalogue avant que la
  date limite n'oblige une destruction.

## 5. Suivre les commandes à expédier

(Widget dashboard reporté V1.5 — utiliser la vue Orders avec filtre
`status=completed` + `fulfillment_status=not_fulfilled` en attendant.)

## 6. Demande d'avis automatique (J+10 après livraison)

Cron quotidien à 10:00 (cf. Phase 9). Rien à faire côté équipe — les
emails partent tous seuls. Vérifier le compteur dans Resend.

Si un client se plaint d'avoir reçu trop d'emails, vérifier dans
`customer.metadata.newsletter_marketing` (false = pas de marketing,
respecté par le cron).

## 7. Variables d'environnement utiles

| Var                   | Rôle                                                        |
| --------------------- | ----------------------------------------------------------- |
| `STOCK_LOW_THRESHOLD` | Seuil stock bas (défaut 5)                                  |
| `DDM_SHORT_THRESHOLD` | Seuil DDM courte en jours (défaut 30)                       |
| `STOCK_ALERTS_TO`     | Destinataire des emails alerte (défaut `atelier@lehena.fr`) |

## 8. Erreurs courantes à éviter

- ❌ Approuver un avis en `pending` venant d'un compte qui n'a JAMAIS
  commandé — le système rejette à la submit, mais un import historique
  pourrait passer outre. Vérifier `customer_id` non null.
- ❌ Export CSV ouvert dans Excel US (séparateur `,`) → tout s'aligne
  en colonne A. Configurer Excel FR ou changer les paramètres régionaux.
- ❌ Créer une recette sans `metadata.recipe.steps` → schema invalide,
  pas de rich result.
- ❌ Ignorer une alerte DDM courte — un produit périmé en boutique
  c'est de l'amende DGCCRF.
