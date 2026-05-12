"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { revalidateTag } from "next/cache"

import { getAuthHeaders, getCacheOptions, getCacheTag } from "./cookies"

export interface ReviewSummary {
  id: string
  rating: number
  title: string | null
  body: string
  customer_name: string | null
  approved_at: string | null
}

export interface ReviewAggregate {
  average: number | null
  count: number
}

/**
 * Lists approved reviews for a product. Server-side cached via the
 * Medusa SDK helpers — invalidated by the review.approved event
 * (revalidate tag `reviews-<product_id>`).
 */
export async function listProductReviews(
  productId: string,
  opts?: { limit?: number; offset?: number }
): Promise<{
  reviews: ReviewSummary[]
  aggregate: ReviewAggregate
  pagination: { count: number; limit: number; offset: number }
}> {
  const next = await getCacheOptions(`reviews-${productId}`)
  try {
    return await sdk.client.fetch<{
      reviews: ReviewSummary[]
      aggregate: ReviewAggregate
      pagination: { count: number; limit: number; offset: number }
    }>(`/store/products/${productId}/reviews`, {
      query: {
        limit: opts?.limit ?? 10,
        offset: opts?.offset ?? 0,
      },
      next,
      cache: "force-cache",
    })
  } catch {
    return {
      reviews: [],
      aggregate: { average: null, count: 0 },
      pagination: { count: 0, limit: opts?.limit ?? 10, offset: 0 },
    }
  }
}

export async function submitProductReview(input: {
  productId: string
  rating: number
  title?: string
  body: string
}): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders()
  if (!headers) {
    return {
      success: false,
      error: "Connectez-vous pour laisser un avis.",
    }
  }
  try {
    await sdk.client.fetch(`/store/products/${input.productId}/reviews`, {
      method: "POST",
      body: {
        rating: input.rating,
        title: input.title?.trim() || null,
        body: input.body,
      },
      headers,
    })
    const tag = await getCacheTag(`reviews-${input.productId}`)
    revalidateTag(tag)
    return { success: true }
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : "Erreur réseau."
    if (process.env.NODE_ENV !== "production") {
      medusaError(err)
    }
    return { success: false, error: message }
  }
}
