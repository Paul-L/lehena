"use server"

import { sdk } from "@lib/config"
import { type HttpTypes } from "@medusajs/types"

import { getRegion } from "./regions"

export type FacetSort = "created_at" | "price_asc" | "price_desc"

export interface FacetParams {
  /** 1-indexed */
  page?: number
  limit?: number
  countryCode: string
  /** Single category handle (e.g. "jambons-iparralde"). */
  category_handle?: string
  q?: string
  sort?: FacetSort
  aging_min?: number
  aging_max?: number
  nitrite_free?: boolean
  breed?: string[]
  origin?: string[]
  allergens_excluded?: string[]
  format?: string[]
}

/**
 * Product shape returned by /store/products-faceted — a StoreProduct
 * enriched with light review stats (batched server-side, no per-card fetch).
 */
export type FacetedProduct = HttpTypes.StoreProduct & {
  avg_rating?: number
  review_count?: number
}

interface FacetedResponse {
  products: FacetedProduct[]
  count: number
  limit: number
  offset: number
}

/** Server-only fetcher hitting /store/products-faceted. */
export const listFacetedProducts = async (
  params: FacetParams
): Promise<FacetedResponse> => {
  const limit = params.limit ?? 12
  const page = Math.max(params.page ?? 1, 1)
  const offset = (page - 1) * limit

  const region = await getRegion(params.countryCode)

  const query: Record<string, string | number | boolean> = {
    limit,
    offset,
    sort: params.sort ?? "created_at",
  }
  if (region?.id) query.region_id = region.id
  if (params.category_handle) query.category_handle = params.category_handle
  if (params.q) query.q = params.q
  if (params.aging_min !== undefined) query.aging_min = params.aging_min
  if (params.aging_max !== undefined) query.aging_max = params.aging_max
  if (params.nitrite_free !== undefined)
    query.nitrite_free = params.nitrite_free
  if (params.breed && params.breed.length > 0)
    query.breed = params.breed.join(",")
  if (params.origin && params.origin.length > 0)
    query.origin = params.origin.join(",")
  if (params.allergens_excluded && params.allergens_excluded.length > 0)
    query.allergens_excluded = params.allergens_excluded.join(",")
  if (params.format && params.format.length > 0)
    query.format = params.format.join(",")

  return sdk.client.fetch<FacetedResponse>("/store/products-faceted", {
    method: "GET",
    query,
    cache: "force-cache",
    next: { revalidate: 600, tags: ["products"] },
  })
}
