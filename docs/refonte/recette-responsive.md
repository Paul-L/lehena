# Recette responsive

Test manuel sur **device réel** — pas seulement les devtools Chrome.
Trop de bugs glissent entre les mailles des émulateurs.

---

## Devices cibles

| Device              | Largeur      | Pourquoi                               |
| ------------------- | ------------ | -------------------------------------- |
| iPhone SE (gen 2/3) | 375 px       | Cible le plus petit smartphone moderne |
| iPhone 15 / 15 Pro  | 393 / 393 px | Parc majoritaire iOS FR                |
| iPad (portrait)     | 768 px       | Cibles familles, lecture longue        |
| Tablette Android    | 800 px       | Variabilité Android (Samsung tab A)    |
| Desktop 1280        | 1280 px      | Laptop standard                        |
| Desktop 1920+       | 1920 px      | Écran de bureau large                  |

## Parcours minimum (par device)

1. **Home** → vérifier hero, hero CTA, frieze, footer
2. **Boutique** → grille catégorie, filtres facettes (menu mobile), tri
3. **PDP** → galerie zoom, variants, badges, "Ajouter au panier"
4. **Cart** → modifier qty, supprimer item, message cadeau
5. **Checkout step 1** (address) → champs autocomplete, clavier mobile pas caché

## Critères

- **Pas de scroll horizontal involontaire** sur aucune page
- **Touch targets ≥ 44×44 px** sur tous les éléments interactifs
- **Pas de débordement** de texte hors viewport
- **Images responsive** (`sizes` attribut respecté)
- **Menu hamburger mobile** s'ouvre, focus piégé dedans, close au tap outside
- **Form keyboard** sur iOS : champ pas caché par le clavier, scroll auto vers le champ actif
- **Performance perçue** : aucune jank au scroll, aucun layout shift visible

## Captures d'écran

À stocker dans `docs/refonte/recette-screenshots/<device>/` :

- `home.png`, `category.png`, `pdp.png`, `cart.png`, `checkout.png`

Format : largeur réelle du device, qualité PNG (pas JPEG bavarde).
À conserver pour traçabilité de la bascule.

## Outils utiles

- **Chrome DevTools** : Network throttling 3G, CPU x4 slowdown pour
  simuler des mobiles d'entrée de gamme.
- **BrowserStack** ou **Sauce Labs** (si budget) : permet de tester sur
  des devices réels distants. Utile pour les Samsung anciens.
- **Lighthouse mobile preset** : exécuter sur la PDP + home, viser
  Performance ≥ 90.

## Comportements connus + acceptés

- Le drawer mini-cart est plein écran sur mobile (≤ 720 px). Voulu.
- Le tunnel checkout devient vertical sur mobile (les 4 étapes
  s'empilent). Voulu.
- Le menu burger ne contient PAS le langage switcher sur mobile <
  720 px. Le switcher passe dans le footer mobile.

## Si quelque chose casse

- Bug mineur isolé sur 1 device → ticket P2, ne bloque pas la bascule.
- Bug sur iPhone SE (smallest) → P1, à corriger avant bêta.
- Bug sur iOS majoritaire (15) → P0, bloque la bascule.
