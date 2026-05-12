import {
  type AuthenticatedMedusaRequest,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { REVIEW_MODULE } from "../../../../../modules/review"
import { submitReviewWorkflow } from "../../../../../workflows/review"

import {
  type ListReviewsQuerySchema,
  type SubmitReviewSchema,
} from "./validators"

/**
 * Lists approved reviews for a product. Public, paginated. Aggregate
 * stats (average + count) are returned alongside so the PDP can render
 * them without a second round-trip.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id: product_id } = req.params
  const { limit, offset } = req.validatedQuery as ListReviewsQuerySchema
  const take = limit ?? 10
  const skip = offset ?? 0

  const reviewService = req.scope.resolve(REVIEW_MODULE)
  const [reviews, count] = await reviewService.listAndCountReviews(
    { product_id, status: "approved" },
    { take, skip, order: { approved_at: "DESC" } }
  )

  // Aggregate over the full set, not just the page.
  const all = await reviewService.listReviews(
    { product_id, status: "approved" },
    { take: 10000 }
  )
  const total = all.length
  const sum = all.reduce((s: number, r: { rating: number }) => s + r.rating, 0)
  const average = total > 0 ? sum / total : null

  return res.json({
    reviews: reviews.map(
      (r: {
        id: string
        rating: number
        title: string | null
        body: string
        customer_name: string | null
        approved_at: Date | string | null
      }) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        customer_name: r.customer_name,
        approved_at: r.approved_at,
      })
    ),
    pagination: { count, limit: take, offset: skip },
    aggregate: { average, count: total },
  })
}

/**
 * Submits a new review. Customer must be authenticated and have
 * purchased the product (workflow enforces both). Resulting review is
 * `pending` until an admin approves.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<SubmitReviewSchema>,
  res: MedusaResponse
) {
  const customer_id = req.auth_context?.actor_id
  if (!customer_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Customer authentication required."
    )
  }
  const { id: product_id } = req.params
  const { rating, title, body } = req.validatedBody
  const { result } = await submitReviewWorkflow(req.scope).run({
    input: { product_id, customer_id, rating, title, body },
  })
  return res.json({
    review: { id: result.id, status: result.status, rating: result.rating },
  })
}
