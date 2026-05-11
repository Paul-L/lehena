/**
 * Facet constants for the storefront UI. Kept in sync with the backend zod
 * enums in apps/backend/src/modules/catalog/types.ts. Duplicated rather than
 * imported across the workspace boundary so the storefront stays decoupled
 * from the backend's TypeScript types.
 */

export const BREED_OPTIONS = [
  { value: "Duroc", label: "Duroc" },
  { value: "Kintoa", label: "Kintoa AOC" },
  { value: "Bigorre", label: "Bigorre noir" },
  { value: "Iberico", label: "Iberico" },
  { value: "Autre", label: "Autre" },
] as const

export const ORIGIN_OPTIONS = [
  { value: "Iparralde", label: "Iparralde" },
  { value: "Pays Basque", label: "Pays Basque" },
  { value: "Sud-Ouest", label: "Sud-Ouest" },
  { value: "France", label: "France" },
  { value: "Espagne", label: "Espagne" },
  { value: "Autre", label: "Autre" },
] as const

export const FORMAT_OPTIONS = [
  { value: "entier_os", label: "Entier avec os" },
  { value: "entier_desosse", label: "Entier désossé" },
  { value: "demi", label: "Demi" },
  { value: "quart", label: "Quart" },
  { value: "tranches_100g", label: "Tranches 100 g" },
  { value: "tranches_200g", label: "Tranches 200 g" },
  { value: "bouteille_500ml", label: "Bouteille 50 cl" },
  { value: "bouteille_700ml", label: "Bouteille 70 cl" },
  { value: "bouteille_1l", label: "Bouteille 1 L" },
  { value: "pot_180g", label: "Pot 180 g" },
  { value: "pot_330g", label: "Pot 330 g" },
  { value: "boite_400g", label: "Boîte 400 g" },
  { value: "sachet_100g", label: "Sachet 100 g" },
  { value: "sachet_250g", label: "Sachet 250 g" },
  { value: "sachet_500g", label: "Sachet 500 g" },
  { value: "piece", label: "À la pièce" },
  { value: "coffret", label: "Coffret" },
  { value: "unite", label: "Unité" },
  { value: "autre", label: "Autre" },
] as const

export const ALLERGEN_OPTIONS = [
  { value: "gluten", label: "Gluten" },
  { value: "crustaces", label: "Crustacés" },
  { value: "oeufs", label: "Œufs" },
  { value: "poissons", label: "Poissons" },
  { value: "arachides", label: "Arachides" },
  { value: "soja", label: "Soja" },
  { value: "lait", label: "Lait & lactose" },
  { value: "fruits_coques", label: "Fruits à coque" },
  { value: "celeri", label: "Céleri" },
  { value: "moutarde", label: "Moutarde" },
  { value: "sesame", label: "Sésame" },
  { value: "sulfites", label: "Sulfites" },
  { value: "lupin", label: "Lupin" },
  { value: "mollusques", label: "Mollusques" },
] as const

export const AGING_BUCKETS = [
  { id: "le-12", label: "Moins de 12 mois", min: undefined, max: 11 },
  { id: "12-17", label: "12 – 17 mois", min: 12, max: 17 },
  { id: "18-23", label: "18 – 23 mois", min: 18, max: 23 },
  { id: "24+", label: "24 mois et plus", min: 24, max: undefined },
] as const
