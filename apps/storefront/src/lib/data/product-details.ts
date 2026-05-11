"use server"

import { sdk } from "@lib/config"
import { type HttpTypes } from "@medusajs/types"

import { getRegion } from "./regions"

/**
 * Lehena catalog fields surfaced on the PDP. Mirrors the backend
 * ProductDetails model — kept in sync by hand to avoid coupling to the
 * backend's generated query-entry-points types.
 */
export interface ProductDetailsCatalog {
  id: string
  aging_months: number | null
  origin: string
  breed: string | null
  allergens: string[] | null
  nitrite_free: boolean
  conservation_temp: "ambient" | "fresh" | "frozen"
  conservation_days_after_opening: number | null
  ddm_days: number
  cure_method: string | null
  nutritional: {
    energy_kj?: number
    energy_kcal?: number
    fat?: number
    fat_saturated?: number
    carbs?: number
    sugars?: number
    fiber?: number
    protein?: number
    salt?: number
  } | null
  ingredients: string | null
  terroir_story: string | null
  pairings_tags: string[] | null
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
  noindex: boolean
}

export interface VariantDetailsCatalog {
  id: string
  format: string
  weight_grams: number
}

export interface FaqItem {
  id: string
  question: string
  answer: string
  position: number
}

export type EnrichedProduct = HttpTypes.StoreProduct & {
  product_details?: ProductDetailsCatalog | null
  faq_items?: FaqItem[]
  variants?: (HttpTypes.StoreProductVariant & {
    variant_details?: VariantDetailsCatalog | null
  })[]
}

/** Fetch the full PDP payload for a single product handle. */
export const getProductDetails = async (
  handle: string,
  countryCode: string
): Promise<EnrichedProduct | null> => {
  const region = await getRegion(countryCode)
  return sdk.client
    .fetch<{ product: EnrichedProduct }>(`/store/products/${handle}/details`, {
      method: "GET",
      query: region?.id ? { region_id: region.id } : {},
      cache: "force-cache",
      next: { revalidate: 600, tags: ["products", `product-${handle}`] },
    })
    .then((r) => r.product)
    .catch(() => null)
}
