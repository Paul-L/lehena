import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import {
  submitReviewStep,
  type SubmitReviewStepInput,
} from "./steps/submit-review"

export type SubmitReviewInput = SubmitReviewStepInput

export const submitReviewWorkflow = createWorkflow(
  "submit-review",
  function (input: SubmitReviewInput) {
    const review = submitReviewStep(input)
    emitEventStep({
      eventName: "review.submitted",
      data: {
        id: review.id,
        product_id: review.product_id,
        customer_id: review.customer_id,
        rating: review.rating,
      },
    })
    return new WorkflowResponse(review)
  }
)
