import {
  type AuthenticatedMedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import {
  REVIEW_MODULE,
  type ReviewModuleService,
} from "../../../../modules/review"
import { type UpdateReviewStatusSchema } from "../validators"

/**
 * Bulk-friendly status update — POST instead of PATCH (Medusa convention).
 * Sets approved_at + approved_by when transitioning to "approved" so the
 * audit trail survives moderation history.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<UpdateReviewStatusSchema>,
  res: MedusaResponse
) {
  const { id } = req.params
  const { status } = req.validatedBody
  const adminId = req.auth_context?.actor_id ?? null
  if (!adminId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Admin authentication required."
    )
  }

  const reviewService = req.scope.resolve<ReviewModuleService>(REVIEW_MODULE)
  const patch: Record<string, unknown> = { id, status }
  if (status === "approved") {
    patch.approved_at = new Date()
    patch.approved_by = adminId
  } else if (status === "rejected") {
    patch.approved_at = null
    patch.approved_by = adminId
  } else {
    patch.approved_at = null
    patch.approved_by = null
  }
  const updated = await reviewService.updateReviews(patch)
  return res.json({ review: updated })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  const reviewService = req.scope.resolve<ReviewModuleService>(REVIEW_MODULE)
  await reviewService.deleteReviews(id)
  return res.json({ id, deleted: true })
}
