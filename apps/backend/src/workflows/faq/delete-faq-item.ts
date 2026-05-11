import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { deleteFaqItemStep } from "./steps/delete-faq-item"

export const deleteFaqItemWorkflow = createWorkflow(
  "delete-faq-item",
  function (input: { id: string }) {
    const result = deleteFaqItemStep(input)
    return new WorkflowResponse(result)
  }
)

export default deleteFaqItemWorkflow
