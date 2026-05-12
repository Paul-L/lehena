import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import {
  createCheckoutSessionStep,
  type CreateCheckoutSessionStepInput,
} from "./steps/create-checkout-session"

export type CreateSubscriptionCheckoutInput = CreateCheckoutSessionStepInput

export const createSubscriptionCheckoutWorkflow = createWorkflow(
  "create-subscription-checkout",
  function (input: CreateSubscriptionCheckoutInput) {
    const session = createCheckoutSessionStep(input)
    return new WorkflowResponse(session)
  }
)
