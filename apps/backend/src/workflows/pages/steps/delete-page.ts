import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAGES_MODULE } from "../../../modules/pages"

export type DeletePageStepInput = { id: string }

export const deletePageStep = createStep(
  "delete-page",
  async (input: DeletePageStepInput, { container }) => {
    const pagesService = container.resolve(PAGES_MODULE)

    await pagesService.retrievePage(input.id)
    await pagesService.softDeletePages(input.id)

    return new StepResponse({ id: input.id }, input.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const pagesService = container.resolve(PAGES_MODULE)
    await pagesService.restorePages(id)
  }
)
