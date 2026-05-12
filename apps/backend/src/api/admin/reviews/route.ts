import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"

import { REVIEW_MODULE } from "../../../modules/review"

import { type ListAdminReviewsQuerySchema } from "./validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { limit, offset, status, product_id } =
    req.validatedQuery as ListAdminReviewsQuerySchema
  const take = limit ?? 30
  const skip = offset ?? 0
  const filters: Record<string, unknown> = {}
  if (status) filters.status = status
  if (product_id) filters.product_id = product_id

  const reviewService = req.scope.resolve(REVIEW_MODULE)
  const [reviews, count] = await reviewService.listAndCountReviews(filters, {
    take,
    skip,
    order: { created_at: "DESC" },
  })
  return res.json({ reviews, count, limit: take, offset: skip })
}
