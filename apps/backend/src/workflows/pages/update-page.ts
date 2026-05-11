import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { updatePageStep, type UpdatePageStepInput } from "./steps/update-page"

export type UpdatePageInput = UpdatePageStepInput

export const updatePageWorkflow = createWorkflow(
  "update-page",
  function (input: UpdatePageInput) {
    const page = updatePageStep(input)

    emitEventStep({
      eventName: "page.updated",
      data: {
        id: page.id,
        slug: page.slug,
        locale: page.locale,
      },
    })

    return new WorkflowResponse(page)
  }
)
