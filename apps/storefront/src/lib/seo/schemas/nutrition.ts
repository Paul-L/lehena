import type { ProductDetailsCatalog } from "@lib/data/product-details"

/**
 * schema.org NutritionInformation (per 100 g, EU convention). Only the
 * fields that are actually filled get emitted — Google warns on empty
 * values. Returns null when nothing is available so the caller can skip
 * the block entirely.
 */
export interface NutritionInformationSchema {
  "@type": "NutritionInformation"
  servingSize: string
  calories?: string
  fatContent?: string
  saturatedFatContent?: string
  sodiumContent?: string
  proteinContent?: string
  carbohydrateContent?: string
}

type Nutritional = NonNullable<ProductDetailsCatalog["nutritional"]>

/** "12.5 g" — trims a trailing ".0" so integers stay clean. */
function grams(n: number | undefined): string | undefined {
  if (typeof n !== "number" || Number.isNaN(n)) return undefined
  const rounded = Math.round(n * 10) / 10
  return `${rounded} g`
}

export function nutritionInformation(
  nutritional: Nutritional | null | undefined
): NutritionInformationSchema | null {
  if (!nutritional) return null

  const schema: NutritionInformationSchema = {
    "@type": "NutritionInformation",
    servingSize: "100 g",
  }

  if (typeof nutritional.energy_kcal === "number") {
    schema.calories = `${Math.round(nutritional.energy_kcal)} kcal`
  }
  const fat = grams(nutritional.fat)
  if (fat) schema.fatContent = fat
  const sat = grams(nutritional.fat_saturated)
  if (sat) schema.saturatedFatContent = sat
  // The catalog stores `salt`; schema.org exposes sodiumContent — we surface
  // the salt figure here as the closest available nutrient.
  const salt = grams(nutritional.salt)
  if (salt) schema.sodiumContent = salt
  const protein = grams(nutritional.protein)
  if (protein) schema.proteinContent = protein
  const carbs = grams(nutritional.carbs)
  if (carbs) schema.carbohydrateContent = carbs

  // Only servingSize present → nothing meaningful to emit.
  const hasValues =
    schema.calories !== undefined ||
    schema.fatContent !== undefined ||
    schema.saturatedFatContent !== undefined ||
    schema.sodiumContent !== undefined ||
    schema.proteinContent !== undefined ||
    schema.carbohydrateContent !== undefined

  return hasValues ? schema : null
}
