import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { deleteRedirectStep } from "./steps/delete-redirect"

export const deleteRedirectWorkflow = createWorkflow(
  "delete-redirect",
  function (input: { id: string }) {
    const result = deleteRedirectStep(input)
    return new WorkflowResponse(result)
  }
)

export default deleteRedirectWorkflow
