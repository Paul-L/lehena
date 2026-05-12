import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import {
  mutateSubscriptionStep,
  type MutateSubscriptionStepInput,
} from "./steps/pause-resume-cancel"

export type MutateSubscriptionInput = MutateSubscriptionStepInput

export const mutateSubscriptionWorkflow = createWorkflow(
  "mutate-subscription",
  function (input: MutateSubscriptionInput) {
    const result = mutateSubscriptionStep(input)
    emitEventStep({
      eventName: `subscription.${input.kind}d`,
      data: {
        id: result.id,
        customer_id: result.customer_id,
        status: result.status,
      },
    })
    return new WorkflowResponse(result)
  }
)
