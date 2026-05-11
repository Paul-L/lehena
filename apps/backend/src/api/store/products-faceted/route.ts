import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import type { ListFacetedProductsQuerySchema } from "./validators"

/**
 * Store endpoint: list products filtered by Lehena catalog facets.
 *
 * Phase 3a strategy:
 *  1. If `product_details` filters are set (aging/nitrite/breed/origin/allergens),
 *     query the `product_details` entity first and collect the matching product IDs.
 *  2. If `format` is set, query `variant_details` first and collect matching
 *     variant IDs → product IDs.
 *  3. Intersect any pre-filtered ID sets; that becomes the `id IN (...)` filter
 *     applied to the final `product` query (alongside category and text search).
 *  4. Sort + paginate in the final query.
 *
 * NOTE: native Medusa `query.graph` cannot filter by linked-module fields,
 * which is why the pre-filtering is done separately. Cf. Medusa skill rule
 * `data-linked-filtering`.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const params = req.validatedQuery as ListFacetedProductsQuerySchema
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // ─── 1. Pre-filter by product_details ──────────────────────────────
  let detailsProductIdSet: Set<string> | null = null

  const hasDetailsFilter =
    params.aging_min !== undefined ||
    params.aging_max !== undefined ||
    params.nitrite_free !== undefined ||
    (params.breed !== undefined && params.breed.length > 0) ||
    (params.origin !== undefined && params.origin.length > 0) ||
    (params.allergens_excluded !== undefined &&
      params.allergens_excluded.length > 0)

  if (hasDetailsFilter) {
    const filters: Record<string, unknown> = {}
    if (params.aging_min !== undefined) {
      filters.aging_months = {
        ...(filters.aging_months as Record<string, unknown> | undefined),
        $gte: params.aging_min,
      }
    }
    if (params.aging_max !== undefined) {
      filters.aging_months = {
        ...(filters.aging_months as Record<string, unknown> | undefined),
        $lte: params.aging_max,
      }
    }
    if (params.nitrite_free !== undefined) {
      filters.nitrite_free = params.nitrite_free
    }
    if (params.breed && params.breed.length > 0) {
      filters.breed = { $in: params.breed }
    }
    if (params.origin && params.origin.length > 0) {
      filters.origin = { $in: params.origin }
    }

    const { data: details } = await query.graph({
      entity: "product_details",
      fields: ["id", "allergens", "product.id"],
      filters,
    })

    const filterAllergens = params.allergens_excluded ?? []
    detailsProductIdSet = new Set<string>()
    for (const d of details ?? []) {
      const allergens = (d.allergens ?? []) as string[]
      if (
        filterAllergens.length > 0 &&
        allergens.some((a) => filterAllergens.includes(a))
      ) {
        continue
      }
      const productId = (d as { product?: { id?: string } | null }).product?.id
      if (productId) detailsProductIdSet.add(productId)
    }
  }

  // ─── 2. Pre-filter by variant_details.format ───────────────────────
  let formatProductIdSet: Set<string> | null = null
  if (params.format && params.format.length > 0) {
    const { data: vDetails } = await query.graph({
      entity: "variant_details",
      fields: ["id", "format", "variant.product.id"],
      filters: { format: { $in: params.format } },
    })
    formatProductIdSet = new Set<string>()
    for (const v of vDetails ?? []) {
      const productId = (
        v as { variant?: { product?: { id?: string } | null } | null }
      ).variant?.product?.id
      if (productId) formatProductIdSet.add(productId)
    }
  }

  // ─── 3. Intersect ID sets (if any) ─────────────────────────────────
  let restrictedIds: string[] | null = null
  if (detailsProductIdSet && formatProductIdSet) {
    restrictedIds = [...detailsProductIdSet].filter((id) =>
      formatProductIdSet!.has(id)
    )
  } else if (detailsProductIdSet) {
    restrictedIds = [...detailsProductIdSet]
  } else if (formatProductIdSet) {
    restrictedIds = [...formatProductIdSet]
  }

  if (restrictedIds && restrictedIds.length === 0) {
    return res.json({
      products: [],
      count: 0,
      limit: params.limit,
      offset: params.offset,
    })
  }

  // ─── 4. Final product query ────────────────────────────────────────
  const productFilters: Record<string, unknown> = {
    status: "published",
  }
  if (restrictedIds) {
    productFilters.id = { $in: restrictedIds }
  }
  if (params.category_handle) {
    productFilters.categories = { handle: params.category_handle }
  }
  if (params.q) {
    productFilters.$or = [
      { title: { $ilike: `%${params.q}%` } },
      { handle: { $ilike: `%${params.q}%` } },
      { subtitle: { $ilike: `%${params.q}%` } },
    ]
  }

  // Native Medusa sort options. Price sort needs JS post-sort because
  // calculated_price is a virtual field.
  const orderMap: Record<
    Exclude<typeof params.sort, "price_asc" | "price_desc">,
    Record<string, "ASC" | "DESC">
  > = {
    created_at: { created_at: "DESC" },
    title: { title: "ASC" },
  }
  const order =
    params.sort === "price_asc" || params.sort === "price_desc"
      ? orderMap.created_at
      : orderMap[params.sort]

  const { data: products, metadata } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "subtitle",
      "description",
      "thumbnail",
      "status",
      "created_at",
      "tags.*",
      "categories.id",
      "categories.name",
      "categories.handle",
      "collection.id",
      "collection.handle",
      "collection.title",
      "variants.id",
      "variants.title",
      "variants.sku",
      "variants.inventory_quantity",
      "variants.calculated_price.*",
      "variants.variant_details.id",
      "variants.variant_details.format",
      "variants.variant_details.weight_grams",
      "product_details.*",
    ],
    filters: productFilters,
    pagination: {
      take: params.limit,
      skip: params.offset,
      order,
    },
  })

  // Post-sort by price if needed (only over the current page).
  if (params.sort === "price_asc" || params.sort === "price_desc") {
    const direction = params.sort === "price_asc" ? 1 : -1
    products.sort((a, b) => {
      const pA = cheapestAmount(a as ProductWithPricedVariants)
      const pB = cheapestAmount(b as ProductWithPricedVariants)
      if (pA === null && pB === null) return 0
      if (pA === null) return 1
      if (pB === null) return -1
      return direction * (pA - pB)
    })
  }

  return res.json({
    products,
    count: metadata?.count ?? products.length,
    limit: params.limit,
    offset: params.offset,
  })
}

interface ProductWithPricedVariants {
  variants?: {
    calculated_price?: { calculated_amount?: number | null } | null
  }[]
}

function cheapestAmount(product: ProductWithPricedVariants): number | null {
  let min: number | null = null
  for (const v of product.variants ?? []) {
    const amt = v.calculated_price?.calculated_amount
    if (typeof amt === "number") {
      if (min === null || amt < min) min = amt
    }
  }
  return min
}
