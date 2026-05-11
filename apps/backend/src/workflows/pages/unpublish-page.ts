import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import {
  unpublishPageStep,
  type UnpublishPageStepInput,
} from "./steps/unpublish-page"

export type UnpublishPageInput = UnpublishPageStepInput

export const unpublishPageWorkflow = createWorkflow(
  "unpublish-page",
  function (input: UnpublishPageInput) {
    const page = unpublishPageStep(input)

    emitEventStep({
      eventName: "page.unpublished",
      data: {
        id: page.id,
        slug: page.slug,
        locale: page.locale,
      },
    })

    return new WorkflowResponse(page)
  }
)
