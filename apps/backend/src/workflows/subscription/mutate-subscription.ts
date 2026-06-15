import {
  createWorkflow,
  transform,
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
    const eventInput = transform({ input, result }, ({ input, result }) => ({
      eventName: `subscription.${input.kind}d`,
      data: {
        id: result.id,
        customer_id: result.customer_id,
        status: result.status,
      },
    }))
    emitEventStep(eventInput)
    return new WorkflowResponse(result)
  }
)
