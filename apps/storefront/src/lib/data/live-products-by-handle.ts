"use server"

import { sdk } from "@lib/config"
import { getProductPrice } from "@lib/util/get-product-price"
import { type HttpTypes } from "@medusajs/types"

import { getAuthHeaders, getCacheOptions } from "./cookies"
import { getRegion } from "./regions"

import type { LiveProduct } from "@lib/tiptap-renderer"

/**
 * Bulk-fetch product snapshots by handle, used by CMS pages to hydrate
 * `product-embed` TipTap nodes with live title / thumbnail / price.
 *
 * Returns a Map keyed by handle so the renderer can look up in O(1). Misses
 * (handle no longer exists, region not found, etc.) are silently dropped — the
 * renderer falls back to the snapshot stored in the node attrs.
 */
export async function getLiveProductsByHandle(
  handles: string[],
  countryCode: string
): Promise<Map<string, LiveProduct>> {
  const out = new Map<string, LiveProduct>()
  if (handles.length === 0) return out

  const region = await getRegion(countryCode)
  if (!region) return out

  const headers = await getAuthHeaders()
  const next = await getCacheOptions("products")

  try {
    const { products } = await sdk.client.fetch<{
      products: HttpTypes.StoreProduct[]
    }>("/store/products", {
      query: {
        handle: handles,
        region_id: region.id,
        fields:
          "id,title,handle,thumbnail,*variants.calculated_price,+variants.inventory_quantity",
        limit: handles.length,
      },
      headers,
      next,
      cache: "force-cache",
    })

    for (const p of products) {
      const { cheapestPrice } = getProductPrice({ product: p })
      out.set(p.handle as string, {
        id: p.id,
        handle: p.handle as string,
        title: p.title,
        thumbnail: p.thumbnail ?? null,
        cheapest_price: cheapestPrice?.calculated_price ?? null,
      })
    }
  } catch {
    // Network/region errors fall back to snapshot — log only in dev.
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[live-products-by-handle] failed to hydrate handles",
        handles
      )
    }
  }

  return out
}
