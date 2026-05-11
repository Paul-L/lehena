# CMS Extensions — Documentation copywriter

Ce document décrit les **5 nodes TipTap custom** disponibles dans l'éditeur
admin Lehena, leur shape JSON, et leur rendu côté storefront. Il sert de
référence au copywriter et au copywriter / éditeur de contenu.

Tous les nodes sont **block-level** (sauf indiqué) et sont insérables depuis
la barre d'outils de l'éditeur admin (`/admin/pages/[id]`).

---

## 1. Citation presse (`press-quote`)

Citation tirée d'un média, attribuée à un auteur.

**Quand l'utiliser** : page presse, témoignages dans `/notre-histoire`,
mises en avant éditoriales.

### JSON émis

```json
{
  "type": "press-quote",
  "attrs": {
    "quote": "Le meilleur jambon non-espagnol que j'aie goûté depuis dix ans.",
    "author": "Marc Demaison",
    "outlet": "Le Monde · Le Goût",
    "outlet_logo_url": "https://cdn.lehena.fr/press/lemonde.svg"
  }
}
```

`outlet_logo_url` est optionnel — si fourni, le logo s'affiche en petit
au-dessus de l'attribution.

### Rendu storefront

Citation italique large (font serif display), bordure rouge à gauche, et
attribution en mono petite caisse en dessous (auteur · média + logo
optionnel).

---

## 2. Galerie terroir (`gallery-terroir`)

Galerie horizontale 3-6 images, défilable, lazy-loaded.

**Quand l'utiliser** : photos d'éleveurs, cave d'affinage, atelier — partout
où on veut donner à voir.

### JSON émis

```json
{
  "type": "gallery-terroir",
  "attrs": {
    "items": [
      {
        "src": "https://cdn.lehena.fr/farm/joseph-1.jpg",
        "alt": "Joseph dans son pré",
        "caption": "Joseph, élevage de la Soule"
      },
      {
        "src": "https://cdn.lehena.fr/farm/joseph-2.jpg",
        "alt": "Pâturage d'altitude",
        "caption": "Pâturage d'altitude, juin"
      }
    ]
  }
}
```

`alt` est **obligatoire pour l'accessibilité**. `caption` est optionnel mais
recommandé : elle s'affiche en mono petite caisse sous l'image.

### Rendu storefront

Strip horizontal défilable au touch et à la souris, snap aux items. Hauteur
fixe ~290 px, images en `object-fit: cover`. Pas de lightbox en V1 — on
ouvre l'image en plein écran dans une passe future si besoin.

---

## 3. Embed produit (`product-embed`)

Carte mini-produit insérée au fil du texte, pointant vers la PDP.

**Quand l'utiliser** : articles éditoriaux qui mentionnent un produit
précis, recettes, guides cadeaux.

### Comment insérer

Cliquer sur l'icône **colis** dans la toolbar → un drawer s'ouvre avec un
champ de recherche. Tapez le nom du produit, cliquez sur le résultat.

L'admin stocke un **snapshot** (titre, thumbnail) au moment du choix.

### JSON émis

```json
{
  "type": "product-embed",
  "attrs": {
    "product_id": "prod_01HXYZ...",
    "product_handle": "jambon-orhi-18-mois",
    "product_title": "Jambon Orhi · 18 mois",
    "product_thumbnail": "https://cdn.lehena.fr/products/orhi-18.jpg"
  }
}
```

`product_handle` est la clé de résolution côté storefront — il est stable
entre environnements (les `product_id` ne le sont pas).

### Rendu storefront

Mini-carte horizontale (image + titre + prix « Dès … » + CTA « VOIR → »).
Le prix est **récupéré en live** à chaque request via `/store/products` —
si le produit existe encore, on affiche le prix actuel ; sinon on retombe
sur le snapshot.

Si le produit a été supprimé après l'embed, l'embed reste cliquable et
montre le snapshot, mais le lien renvoie un 404 — à vérifier en relecture.

---

## 4. Encadré / callout (`callout`)

Aside discret pour "Le saviez-vous ?", "À noter", "Attention".

**Quand l'utiliser** : information secondaire qu'on ne veut pas mettre en
gras dans le corps du texte (anecdote, mise en garde, précision).

### JSON émis

```json
{
  "type": "callout",
  "attrs": {
    "tone": "note",
    "title": "Le saviez-vous ?"
  },
  "content": [
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Un jambon Lehena perd 40 % de son poids à l'affinage."
        }
      ]
    }
  ]
}
```

`tone` peut être :

- `info` — neutre (bordure grise)
- `note` — pédagogique (bordure olive, pour "Le saviez-vous ?")
- `warning` — vigilance (bordure rouge, pour "CONTENU À FOURNIR", mises en
  garde, conservation)

`title` est optionnel et s'affiche en mono petite caisse au-dessus du
contenu. Le `content` est un tableau de nodes block standard (paragraphes,
listes, etc.).

### Rendu storefront

Bloc avec bordure latérale colorée selon le tone, fond légèrement contrasté.

---

## 5. Étape de recette (`recipe-step`)

Étape numérotée pour articles recettes (Phase 9/10), avec durée optionnelle.

**Quand l'utiliser** : pages recette, guides de préparation, mises en bouche
("À table en 10 minutes").

### JSON émis

```json
{
  "type": "recipe-step",
  "attrs": {
    "step_number": 1,
    "duration_min": 5
  },
  "content": [
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Sortir le jambon du réfrigérateur 30 minutes avant de servir."
        }
      ]
    }
  ]
}
```

`step_number` part de 1. `duration_min` est optionnel.

### Rendu storefront

Médaillon circulaire avec le numéro à gauche, durée en mono petite caisse
en dessous, contenu à droite. Séparateur en haut de chaque étape.

---

## Marks (inline)

Les marks suivantes sont disponibles partout dans l'éditeur. Les rendus
storefront sont identiques à TipTap par défaut :

- **bold** — `<strong>`
- _italic_ — `<em>`
- ~~strike~~ — `<s>`
- `code` — `<code>` inline (fond gris clair, mono)
- underline — `<u>`
- [link](https://example.com) — `<a target="_blank" rel="noopener noreferrer">`

---

## Champs SEO disponibles sur chaque Page

Indépendamment du contenu TipTap, chaque page CMS possède :

| Champ                  | Type          | Notes                                             |
| ---------------------- | ------------- | ------------------------------------------------- |
| `meta_title`           | string ≤70    | Override `<title>`                                |
| `meta_description`     | string ≤160   | Override `<meta name="description">`              |
| `og_image_url`         | url           | Image OpenGraph (1200×630 recommandé)             |
| `noindex`              | boolean       | Cache la page des moteurs de recherche            |
| `canonical_override`   | url           | Pour rediriger les signaux SEO vers une autre URL |
| `locale`               | enum fr/es/en | Langue de la page (FR par défaut)                 |
| `translation_group_id` | uuid          | Lie les traductions entre elles                   |

---

## Multilingue : créer une traduction

Depuis l'admin :

1. Ouvrir une page existante en FR (ex : `/notre-histoire`).
2. Cliquer sur **« Créer une traduction »**, choisir la langue cible.
3. Une nouvelle page est dupliquée en draft, avec le slug
   `notre-histoire-es` par défaut (modifiable). Elle hérite du contenu
   et des métadonnées de la source.
4. Traduire le contenu et publier.

Le bouton appelle `POST /admin/pages/[id]/translate` avec
`{ target_locale: "es", slug?: "..." }`.

---

## Multilingue : routing storefront

La langue est dérivée du `countryCode` dans l'URL :

| countryCode                              | locale |
| ---------------------------------------- | ------ |
| `fr`, `be`, `ch`, `ca`, `lu`, `mc`       | fr     |
| `es`, `ad`, `mx`, `ar`, `cl`, `pe`, `uy` | es     |
| `gb`, `uk`, `us`, `ie`, `au`, `nz`       | en     |

Pour ajouter un pays, modifier `apps/storefront/src/lib/i18n/locale-map.ts`.

Le storefront émet automatiquement les `<link rel="alternate"
hreflang="...">` correspondants en se basant sur les traductions publiées
de la page (resolved via `translation_group_id`).

---

## Tests et validation

Avant de pousser une page en production :

- [ ] Tester sur `/admin/pages/[id]/preview` (preview token court terme)
- [ ] Vérifier le rendu sur `/{countryCode}/{slug}` en local
- [ ] Si page éditoriale → valider le schema `Article` sur
      [validator.schema.org](https://validator.schema.org/)
- [ ] Si page traduite → vérifier les `hreflang` dans le `<head>` de
      chaque variante
- [ ] Si page contient `product-embed` → vérifier que les produits
      référencés existent encore et que leur prix s'affiche
