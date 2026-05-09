import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAGES_MODULE } from "../../../modules/pages"

export type PublishPageStepInput = { id: string }

export const publishPageStep = createStep(
  "publish-page",
  async (input: PublishPageStepInput, { container }) => {
    const pagesService = container.resolve(PAGES_MODULE)

    const before = await pagesService.retrievePage(input.id)

    const updated = await pagesService.updatePages({
      id: input.id,
      status: "published",
      published_at: before.published_at ?? new Date(),
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
      published_at: before.published_at,
    })
  }
)
