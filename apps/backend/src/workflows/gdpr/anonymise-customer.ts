import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import {
  anonymiseCustomerStep,
  type AnonymiseCustomerStepInput,
} from "./steps/anonymise-customer"

export type AnonymiseCustomerInput = AnonymiseCustomerStepInput

export const anonymiseCustomerWorkflow = createWorkflow(
  "anonymise-customer",
  function (input: AnonymiseCustomerInput) {
    const result = anonymiseCustomerStep(input)
    return new WorkflowResponse(result)
  }
)
