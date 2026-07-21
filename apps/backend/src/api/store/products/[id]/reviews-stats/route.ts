import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"

import {
  REVIEW_MODULE,
  type ReviewModuleService,
} from "../../../../../modules/review"

/**
 * Public aggregate stats for a product's approved reviews. `[id]` is the
 * product id (same convention as the sibling /reviews route). Feeds the
 * PDP AggregateRating and the storefront star UI.
 *
 * GET → { average_rating, review_count, distribution }
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id: product_id } = req.params
  const reviewService = req.scope.resolve<ReviewModuleService>(REVIEW_MODULE)
  const stats = await reviewService.getProductStats(product_id)
  return res.json(stats)
}
