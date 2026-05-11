import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { createRedirectStep } from "./steps/create-redirect"

import type { CreateRedirectInput } from "../../modules/redirects/types"

export const createRedirectWorkflow = createWorkflow(
  "create-redirect",
  function (input: CreateRedirectInput) {
    const result = createRedirectStep(input)
    return new WorkflowResponse(result)
  }
)

export default createRedirectWorkflow
