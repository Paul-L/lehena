import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { createPageStep, type CreatePageStepInput } from "./steps/create-page"

export type CreatePageInput = CreatePageStepInput

export const createPageWorkflow = createWorkflow(
  "create-page",
  function (input: CreatePageInput) {
    const page = createPageStep(input)

    emitEventStep({
      eventName: "page.created",
      data: {
        id: page.id,
        slug: page.slug,
        locale: page.locale,
      },
    })

    return new WorkflowResponse(page)
  }
)
