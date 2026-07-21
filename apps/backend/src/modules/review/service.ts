import { MedusaService } from "@medusajs/framework/utils"

import Review from "./models/review"

/** Per-star breakdown of approved reviews. Keys are the ratings 1..5. */
export type RatingDistribution = Record<1 | 2 | 3 | 4 | 5, number>

/** Full stats payload for a single product (PDP + reviews-stats route). */
export interface ProductReviewStats {
  /** Mean rating over approved reviews, rounded to 1 decimal (0 if none). */
  average_rating: number
  /** Count of approved reviews. */
  review_count: number
  /** How many approved reviews landed on each star. */
  distribution: RatingDistribution
}

/** Light stats used to enrich product lists (grids) without a full fetch. */
export interface LightReviewStats {
  avg_rating: number
  review_count: number
}

function emptyDistribution(): RatingDistribution {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
}

/** Clamp a raw rating to the 1..5 star buckets, ignoring anything else. */
function asStar(rating: number): 1 | 2 | 3 | 4 | 5 | null {
  const r = Math.round(rating)
  return r >= 1 && r <= 5 ? (r as 1 | 2 | 3 | 4 | 5) : null
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

class ReviewModuleService extends MedusaService({
  Review,
}) {
  /**
   * Aggregate stats for one product, computed on the fly over approved
   * reviews only (strategy A — fine for the current low volume, cf.
   * SEO prompt 11). Returns average (1 decimal), count and per-star
   * distribution.
   */
  async getProductStats(productId: string): Promise<ProductReviewStats> {
    const reviews = (await this.listReviews(
      { product_id: productId, status: "approved" },
      { select: ["rating"], take: 100000 }
    )) as { rating: number }[]

    const distribution = emptyDistribution()
    let sum = 0
    let count = 0
    for (const r of reviews) {
      const star = asStar(r.rating)
      if (star === null) continue
      distribution[star] += 1
      sum += star
      count += 1
    }

    return {
      average_rating: count > 0 ? round1(sum / count) : 0,
      review_count: count,
      distribution,
    }
  }

  /**
   * Batched light stats for many products in a single query — used to
   * enrich list endpoints (product grids) without N round-trips. Products
   * with no approved review are simply absent from the returned map; the
   * caller decides how to render that.
   */
  async getProductsStats(
    productIds: string[]
  ): Promise<Record<string, LightReviewStats>> {
    if (productIds.length === 0) return {}

    const reviews = (await this.listReviews(
      { product_id: productIds, status: "approved" },
      { select: ["product_id", "rating"], take: 100000 }
    )) as { product_id: string; rating: number }[]

    const acc = new Map<string, { sum: number; count: number }>()
    for (const r of reviews) {
      const star = asStar(r.rating)
      if (star === null) continue
      const entry = acc.get(r.product_id) ?? { sum: 0, count: 0 }
      entry.sum += star
      entry.count += 1
      acc.set(r.product_id, entry)
    }

    const out: Record<string, LightReviewStats> = {}
    for (const [productId, { sum, count }] of acc) {
      out[productId] = {
        avg_rating: count > 0 ? round1(sum / count) : 0,
        review_count: count,
      }
    }
    return out
  }
}

export default ReviewModuleService
