import type {
  ProductDetailsInputSchema,
  VariantDetailsInput,
} from "../../../modules/catalog/types"
import type { z } from "zod"

// Use the *input* shape (before zod defaults are applied) so seed entries
// can omit optional fields like `pairings_tags`.
export type ProductDetailsInputShape = z.input<typeof ProductDetailsInputSchema>

export interface VariantSeed {
  title: string
  sku: string
  // EUR amount stored as-is per Medusa convention (49.99 = 49.99 €, never centimes).
  price_eur: number
  weight_grams: number
  format: VariantDetailsInput["format"]
  manage_inventory?: boolean
  initial_stock?: number
}

export interface ProductSeed {
  handle: string
  title: string
  subtitle?: string
  description: string
  // Mapped to product_type by handle (alimentaire | accessoire).
  product_type: "alimentaire" | "accessoire"
  // Mapped to shipping profile by kind (fresh | ambient).
  shipping_kind: "fresh" | "ambient"
  // Lehena category handles this product belongs to. The most specific
  // sub-category should come first.
  category_handles: string[]
  variants: VariantSeed[]
  details: ProductDetailsInputShape
}
