import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import {
  ensureRedirectOnHandleChangeStep,
  type EnsureRedirectOnHandleChangeInput,
} from "./steps/ensure-redirect-on-handle-change"

export const ensureRedirectOnHandleChangeWorkflow = createWorkflow(
  "ensure-redirect-on-handle-change",
  function (input: EnsureRedirectOnHandleChangeInput) {
    const result = ensureRedirectOnHandleChangeStep(input)
    return new WorkflowResponse(result)
  }
)

export default ensureRedirectOnHandleChangeWorkflow
