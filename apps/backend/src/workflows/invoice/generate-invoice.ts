import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import {
  generateInvoiceStep,
  type GenerateInvoiceStepInput,
} from "./steps/generate-invoice"

export type GenerateInvoiceInput = GenerateInvoiceStepInput

export const generateInvoiceWorkflow = createWorkflow(
  "generate-invoice",
  function (input: GenerateInvoiceInput) {
    const invoice = generateInvoiceStep(input)
    return new WorkflowResponse(invoice)
  }
)
