import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { updateFaqItemStep } from "./steps/update-faq-item"

import type { FaqItemUpdateInput } from "../../modules/faq/types"

interface UpdateFaqItemInput {
  id: string
  data: FaqItemUpdateInput
}

export const updateFaqItemWorkflow = createWorkflow(
  "update-faq-item",
  function (input: UpdateFaqItemInput) {
    const result = updateFaqItemStep(input)
    return new WorkflowResponse(result)
  }
)

export default updateFaqItemWorkflow
