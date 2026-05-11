import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { createFaqItemStep } from "./steps/create-faq-item"

import type { FaqItemCreateInput } from "../../modules/faq/types"

interface CreateFaqItemInput {
  product_id: string
  data: FaqItemCreateInput
}

export const createFaqItemWorkflow = createWorkflow(
  "create-faq-item",
  function (input: CreateFaqItemInput) {
    const result = createFaqItemStep(input)
    return new WorkflowResponse(result)
  }
)

export default createFaqItemWorkflow
