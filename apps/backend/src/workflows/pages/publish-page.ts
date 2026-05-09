import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import {
  publishPageStep,
  type PublishPageStepInput,
} from "./steps/publish-page"

export type PublishPageInput = PublishPageStepInput

export const publishPageWorkflow = createWorkflow(
  "publish-page",
  function (input: PublishPageInput) {
    const page = publishPageStep(input)

    emitEventStep({
      eventName: "page.published",
      data: {
        id: page.id,
        slug: page.slug,
        locale: page.locale,
      },
    })

    return new WorkflowResponse(page)
  }
)
