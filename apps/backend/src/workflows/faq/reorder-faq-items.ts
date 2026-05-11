import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { reorderFaqItemsStep } from "./steps/reorder-faq-items"

import type { FaqItemsReorderInput } from "../../modules/faq/types"

export const reorderFaqItemsWorkflow = createWorkflow(
  "reorder-faq-items",
  function (input: FaqItemsReorderInput) {
    const result = reorderFaqItemsStep(input)
    return new WorkflowResponse(result)
  }
)

export default reorderFaqItemsWorkflow
