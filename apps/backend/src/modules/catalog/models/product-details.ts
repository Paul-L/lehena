import { model } from "@medusajs/framework/utils"

// Lehena catalog → product-level custom fields.
// Linked 1-1 to Medusa core `Product` via src/links/product-product-details.ts.
// Stored separately so we don't fork the core Product entity.
const ProductDetails = model.define("product_details", {
  id: model.id().primaryKey(),

  // ─── Filière / métier ─────────────────────────────────────────────
  aging_months: model.number().nullable(),
  origin: model.text(),
  breed: model.text().nullable(),
  allergens: model.array().nullable(),
  nitrite_free: model.boolean().default(false),
  conservation_temp: model
    .enum(["ambient", "fresh", "frozen"])
    .default("ambient"),
  conservation_days_after_opening: model.number().nullable(),
  ddm_days: model.number(),
  cure_method: model.text().nullable(),

  // ─── Contenu PDP ──────────────────────────────────────────────────
  nutritional: model.json().nullable(),
  ingredients: model.text().nullable(),
  terroir_story: model.text().nullable(),
  pairings_tags: model.array().nullable(),

  // ─── SEO (cf. strategie-seo.md § 11 → Phase 1) ────────────────────
  seo_title: model.text().nullable(),
  seo_description: model.text().nullable(),
  og_image_url: model.text().nullable(),
  noindex: model.boolean().default(false),
})

export default ProductDetails
