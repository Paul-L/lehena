import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { PAGES_MODULE } from "../../../modules/pages"

export interface UnpublishPageStepInput {
  id: string
}

export const unpublishPageStep = createStep(
  "unpublish-page",
  async (input: UnpublishPageStepInput, { container }) => {
    const pagesService = container.resolve(PAGES_MODULE)

    const before = await pagesService.retrievePage(input.id)

    const updated = await pagesService.updatePages({
      id: input.id,
      status: "draft",
    })

    return new StepResponse(updated, before)
  },
  async (before, { container }) => {
    if (!before) {
      return
    }
    const pagesService = container.resolve(PAGES_MODULE)
    await pagesService.updatePages({
      id: before.id,
      status: before.status,
    })
  }
)
