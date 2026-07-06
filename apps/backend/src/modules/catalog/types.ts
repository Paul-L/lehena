import { z } from "zod"

// ─── Enums (contraintes au layer API, pas en BDD pour rester souples) ───

export const ORIGIN_VALUES = [
  "Iparralde",
  "Pays Basque",
  "Sud-Ouest",
  "France",
  "Espagne",
  "Autre",
] as const
export type Origin = (typeof ORIGIN_VALUES)[number]

export const BREED_VALUES = [
  "Duroc",
  "Bigorre",
  "Kintoa",
  "Iberico",
  "Autre",
] as const
export type Breed = (typeof BREED_VALUES)[number]

export const CONSERVATION_TEMP_VALUES = ["ambient", "fresh", "frozen"] as const
export type ConservationTemp = (typeof CONSERVATION_TEMP_VALUES)[number]

export const VARIANT_FORMAT_VALUES = [
  // Charcuterie
  "entier_os",
  "entier_desosse",
  "demi",
  "quart",
  "tranches_100g",
  "tranches_200g",
  // Bouteilles / pots / conserves
  "bouteille_500ml",
  "bouteille_700ml",
  "bouteille_750ml",
  "bouteille_1l",
  "pot_180g",
  "pot_330g",
  "boite_400g",
  // Sachets / divers
  "sachet_100g",
  "sachet_250g",
  "sachet_500g",
  "piece",
  // Coffrets et accessoires
  "coffret",
  "unite",
  "autre",
] as const
export type VariantFormat = (typeof VARIANT_FORMAT_VALUES)[number]

// Allergens — liste contrôlée INCO (FR ne distingue pas tous,
// mais on s'aligne sur le règlement INCO européen 14 allergènes).
export const ALLERGEN_VALUES = [
  "gluten",
  "crustaces",
  "oeufs",
  "poissons",
  "arachides",
  "soja",
  "lait",
  "fruits_a_coque",
  "celeri",
  "moutarde",
  "sesame",
  "sulfites",
  "lupin",
  "mollusques",
] as const
export type Allergen = (typeof ALLERGEN_VALUES)[number]

// ─── Schemas zod pour les validations API + workflow inputs ────────────

export const NutritionalSchema = z
  .object({
    energy_kj: z.number().nonnegative().optional(),
    energy_kcal: z.number().nonnegative().optional(),
    fat: z.number().nonnegative().optional(),
    fat_saturated: z.number().nonnegative().optional(),
    carbs: z.number().nonnegative().optional(),
    sugars: z.number().nonnegative().optional(),
    fiber: z.number().nonnegative().optional(),
    protein: z.number().nonnegative().optional(),
    salt: z.number().nonnegative().optional(),
  })
  .strict()
export type Nutritional = z.infer<typeof NutritionalSchema>

export const ProductDetailsInputSchema = z
  .object({
    aging_months: z.number().int().min(0).max(60).nullable().optional(),
    origin: z.enum(ORIGIN_VALUES),
    breed: z.enum(BREED_VALUES).nullable().optional(),
    allergens: z.array(z.enum(ALLERGEN_VALUES)).default([]),
    nitrite_free: z.boolean().default(false),
    conservation_temp: z.enum(CONSERVATION_TEMP_VALUES).default("ambient"),
    conservation_days_after_opening: z
      .number()
      .int()
      .min(1)
      .max(180)
      .nullable()
      .optional(),
    ddm_days: z.number().int().min(1).max(3650),
    cure_method: z.string().max(200).nullable().optional(),
    nutritional: NutritionalSchema.nullable().optional(),
    ingredients: z.string().max(2000).nullable().optional(),
    terroir_story: z.string().max(4000).nullable().optional(),
    pairings_tags: z.array(z.string().min(1).max(80)).default([]),
    seo_title: z.string().max(60).nullable().optional(),
    seo_description: z.string().max(160).nullable().optional(),
    og_image_url: z.string().url().nullable().optional(),
    noindex: z.boolean().default(false),
  })
  .strict()
export type ProductDetailsInput = z.infer<typeof ProductDetailsInputSchema>

export const VariantDetailsInputSchema = z
  .object({
    sku: z.string().min(1),
    weight_grams: z.number().int().positive(),
    format: z.enum(VARIANT_FORMAT_VALUES),
  })
  .strict()
export type VariantDetailsInput = z.infer<typeof VariantDetailsInputSchema>

// Wrapper used by createProductsWorkflow / updateProductsWorkflow as
// `additional_data.catalog`.
export const CatalogAdditionalDataSchema = z
  .object({
    product: ProductDetailsInputSchema,
    variants: z.array(VariantDetailsInputSchema).default([]),
  })
  .strict()
export type CatalogAdditionalData = z.infer<typeof CatalogAdditionalDataSchema>
