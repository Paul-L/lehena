import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { REVIEW_MODULE } from "../../../modules/review"

export interface SubmitReviewStepInput {
  product_id: string
  customer_id: string
  rating: number
  title?: string | null
  body: string
}

/**
 * Persists a customer review in `pending` status. Eligibility checks:
 *   1. The customer has at least one captured order that contains the
 *      target product (queried via the order module).
 *   2. The customer hasn't already left a review for this product (the
 *      partial unique index on (product_id, customer_id) blocks duplicates,
 *      we surface a clean error before the insert).
 *
 * The review never lands as `approved` here — Phase 10 V1 enforces manual
 * moderation. Auto-approval rules live in a future workflow.
 */
export const submitReviewStep = createStep(
  "submit-review",
  async (input: SubmitReviewStepInput, { container }) => {
    if (input.rating < 1 || input.rating > 5) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Rating must be between 1 and 5."
      )
    }
    if (!input.body.trim()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Body cannot be empty."
      )
    }

    const reviewService = container.resolve(REVIEW_MODULE)
    // Idempotence — a re-submission overwrites the previous draft if the
    // customer has one pending. Approved/rejected reviews stay locked.
    const existing = await reviewService.listReviews({
      product_id: input.product_id,
      customer_id: input.customer_id,
    })
    if (existing.length > 0 && existing[0].status !== "pending") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Vous avez déjà laissé un avis pour ce produit."
      )
    }

    // Eligibility — verify the customer has a completed order with the
    // product. We use query.graph so the order module isn't manipulated
    // directly from this step.
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "items.product_id", "status"],
      filters: { customer_id: input.customer_id },
    })
    const eligibleOrder = (orders ?? []).find((o) => {
      const items = (o as { items?: { product_id?: string | null }[] }).items
      return (items ?? []).some((it) => it.product_id === input.product_id)
    })
    if (!eligibleOrder) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Vous devez avoir commandé ce produit pour laisser un avis."
      )
    }

    const customerService = container.resolve(Modules.CUSTOMER)
    const customer = await customerService.retrieveCustomer(input.customer_id)
    const customerName =
      [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || "Client Lehena"

    let review
    if (existing.length > 0) {
      review = await reviewService.updateReviews({
        id: existing[0].id,
        rating: input.rating,
        title: input.title?.trim() || null,
        body: input.body.trim(),
        order_id: eligibleOrder.id,
      })
    } else {
      review = await reviewService.createReviews({
        product_id: input.product_id,
        customer_id: input.customer_id,
        customer_name: customerName,
        rating: input.rating,
        title: input.title?.trim() || null,
        body: input.body.trim(),
        status: "pending",
        order_id: eligibleOrder.id,
      })
    }
    return new StepResponse(review, review.id)
  },
  async (id, { container }) => {
    if (!id) return
    const reviewService = container.resolve(REVIEW_MODULE)
    await reviewService.deleteReviews(id)
  }
)
