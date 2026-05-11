import { model } from "@medusajs/framework/utils"

// Lehena catalog → variant-level custom fields.
// Linked 1-1 to Medusa core `ProductVariant` via src/links/variant-variant-details.ts.
const VariantDetails = model.define("variant_details", {
  id: model.id().primaryKey(),

  // Real shipping weight per variant. Drives Chronofresh/Colissimo
  // pricing in Phase 5; differs from Medusa's optional `weight` on Variant.
  weight_grams: model.number(),

  // Free-form format identifier (validated via zod at the API layer):
  // entier_os | entier_desosse | demi | quart | tranches_100g | bouteille | pot ...
  // Kept as text rather than DB enum to avoid migration churn as we
  // add categories (épicerie, plats cuisinés, coffrets…).
  format: model.text(),
})

export default VariantDetails
